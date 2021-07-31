import {NodeVM} from 'bsnk-dev-vm2';
import {vol} from 'memfs';
import {InstanceI} from '../interfaces/instances';
import LogManager from '../services/logManager';
import config from './config';
import {CachedNodeVMI} from '../interfaces/caching';
import volumes from './volumes';
import database from './database';
import instancesLogging from './instancesLogging';
import packages from './packages';
import {join} from 'path';
import {waitUntil} from 'async-wait-until';
import {IncomingMessage, ServerResponse} from 'http';
import cluster from 'cluster';


/**
 * Handles the execution of specific cloud functions and vm management
 */
class ExecutionService {
  private inMemoryVMs: CachedNodeVMI[] = [];
  private isInitalizing = new Map<string, boolean>();

  private logs = new LogManager().updateContext('ExecutionService');

  /**
   * Garbage collect unsed cached volumes and vms
   */
  private gc() {
    this.inMemoryVMs = this.inMemoryVMs.filter((vm) => {
      if (vm.timeLastUsed < Date.now() - vm.ttl) {
        this.logs.log(`Removing VM ${vm.instanceID} from memory`);
        return false;
      }
      return true;
    });
  }

  /**
   * Starts garbage collection
   */
  constructor() {
    setInterval(this.gc.bind(this), config.json.execution.gcInterval);
  }

  /**
   * Gets a vm, and if it's cached returns that
   * @param {string} instanceID The id of the instance to start a vm of
   * @param {_Volume} volume The actual volume that the vm will access
   * @param {string} volumeID The id of the volume to start the vm with
   * @return {Promise<NodeVM>}
   */
  private async getVM(instanceID: string, volume: typeof vol, volumeID: string): Promise<NodeVM> {
    const cachedVM = this.inMemoryVMs.find((vm) => {
      return vm.instanceID === instanceID;
    });

    if (cachedVM) {
      cachedVM.timeLastUsed = Date.now();
      return cachedVM.nodeVm;
    }

    const newVM = new NodeVM({
      require: {
        external: {
          modules: ['*'],
          transitive: true,
        },
        builtin: ['*'],
        allowModifyingBuiltin: false,
        mock: {
          fs: volume,
        },
        root: (process.env.production == 'true') ?
          config.json.execution.vms.sandboxDirectory.production :
          config.json.execution.vms.sandboxDirectory.development,
        context: 'host',
        allowCaching: false,
        resolve: packages.packageResolverFactory(volumeID),
      },
      console: 'redirect',
    });

    this.listenToLogs(newVM, instanceID);

    this.inMemoryVMs.push({
      nodeVm: newVM,
      instanceID,
      timeLastUsed: Date.now(),
      ttl: config.json.execution.ttl.vms,
    });

    return newVM;
  }

  /**
   * Helper to get vm exports (which is what the requests are called on) from a running vm
   * @param {string} instanceID The id of the instance to start a vm of
   * @return {Promise<any>}
   */
  private async getVMExports(instanceID: string): Promise<any> {
    const cachedVM = this.inMemoryVMs.find((vm) => {
      return vm.instanceID === instanceID;
    });

    if (cachedVM?.exports) return cachedVM.exports;

    return null;
  }


  /**
   * Initalize a cloud function
   * @param {InstanceI} instance The instance data to initalize
   */
  public async initalize(instance: InstanceI): Promise<any> {
    this.isInitalizing.set(instance.instanceID, true);

    const volume = await volumes.getVolume(instance.volumeID || '');
    const vm = await this.getVM(instance._id || '', volume, instance.volumeID || '');

    this.logs.log(`Initalizing VM ${instance._id}`);

    /**
     * So the vm has access to the in memory volume
     */
    const patchedRequire = (`
      (() => {
        const _filesystemVolume = require('fs');
        const oldRequire = Object.assign(require);

        patchedRequire.cache = Object.create(null);

        process.stdout = {};
        process.stderr = {};

        function patchedRequire(name) {
            if (name == 'fs') return _filesystemVolume;

            if (!name.startsWith('.') && !name.startsWith('/')) {
              return oldRequire(name);
            }

            if (!(name in patchedRequire.cache)) {     
                let code = _filesystemVolume.readFileSync(name, 'utf8');
                let module = {exports: {}};
                patchedRequire.cache[name] = module;
                let wrapper = Function("require, exports, module", code);
                wrapper(patchedRequire, module.exports, module);
            }
            return patchedRequire.cache[name].exports;
        }

        require = patchedRequire;
      })();
    `);

    const packageInfo = volume.readFileSync('/package.json').toString();
    const packageJson = JSON.parse(packageInfo);

    const indexJS = volume.readFileSync(packageJson.main).toString();

    const sandboxDirectory = (process.env.production == 'true') ?
      config.json.execution.vms.sandboxDirectory.production :
      config.json.execution.vms.sandboxDirectory.development;

    const vmExports = vm.run(`${patchedRequire} ${indexJS}`, join(sandboxDirectory, instance.volumeID || ''));

    const cachedVM =
      this.inMemoryVMs.find((vm) => {
        return vm.instanceID === instance._id;
      });

    if (cachedVM) {
      cachedVM.exports = vmExports;
      cachedVM.volumeID = instance.volumeID || undefined;
    }

    this.isInitalizing.delete(instance._id as string);

    return vmExports;
  }

  /**
   * Listens to logs from a vm
   * @param {NodeVM} vm The vm to listen to logs from
   * @param {string} instanceID The id of the instance to mark logs with
   */
  private listenToLogs(vm: NodeVM, instanceID: string) {
    vm.on('console.log', (data) => {
      instancesLogging.log('info', data, instanceID);
    });
    vm.on('console.info', (data) => {
      instancesLogging.log('info', data, instanceID);
    });
    vm.on('console.error', (data) => {
      instancesLogging.log('error', data, instanceID);
    });
    vm.on('console.war', (data) => {
      instancesLogging.log('warn', data, instanceID);
    });
    vm.on('console.trace', (data) => {
      instancesLogging.log('error', data, instanceID);
    });
  }

  /**
   * Reinializes vms using a volume that has changed
   * @param {string} volumeID The id of the volume used by vms that need to be reinitalized
   */
  public async reinitalizeInstancesUsingVolume(volumeID: string): Promise<void> {
    for (const instance of this.inMemoryVMs) {
      if (instance.volumeID === volumeID) {
        const instanceData = await database.getInstanceByIdOrName(instance.instanceID);
        if (!instanceData) {
          this.logs.log(`Instance in memory ${instance.instanceID} not found in database`);
          continue;
        }

        this.initalize(instanceData);
      }
    }
  }

  /**
   * Reinitializes vms with a particular id
   * @param {string} instanceID The id of the instance to reinitalize
   */
  public async reinitalizeInstancesWithID(instanceID: string) {
    /**
     * Tell all nodes to perform this function
     */
    if (cluster.isPrimary && cluster.workers) {
      for (const [workerID] of Object.entries(cluster.workers)) {
        const w = cluster.workers[workerID];
        if (!w) continue;

        w.send({
          type: 'reloadVM',
          id: instanceID,
        });
      }

      // Primary doesn't execute VM instances
      return;
    }

    for (const instance of this.inMemoryVMs) {
      if (instance.instanceID === instanceID) {
        const instanceData = await database.getInstanceByIdOrName(instanceID);

        if (!instanceData || !instanceData._id) return;
        await this.initalize(instanceData);
      }
    }
  }

  /**
   * Executes the cloud function in the vm
   * @param {InstanceI} instance The id of the instance to execute the function with
   * @param {IncomingMessage} request The request to execute the function with
   * @param {ServerResponse} response The response to execute the function with
   * @return {Promise<void>}
   */
  public async execute(instance: InstanceI, request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!instance._id) return;

    const cachedVM = this.inMemoryVMs.find((vm) => {
      return vm.instanceID === instance._id;
    });

    let vmExports;

    if (!cachedVM) {
      if (!this.isInitalizing.has(instance._id)) {
        vmExports = await this.initalize(instance).catch((e) => {
          this.logs.log(`Error initalizing VM ${instance._id}`);
          instancesLogging.log('error', `Failed to initalize instance, ${e} ${(e as Error).stack}`, instance._id || 'unknown_id');
        });
      } else {
        await waitUntil(() => !this.isInitalizing.has(instance._id as string), {timeout: 5000});
        vmExports = this.getVMExports(instance._id as string);
      }
    } else {
      vmExports = cachedVM.exports;
    }

    if (!vmExports) {
      this.logs.log(`VM exports not found for instance ${instance._id}, reloading.`);
      await this.initalize(instance);
    }

    // Removes the thing before it os the vm believes it's at the root
    // of the endpoint
    const url = request.url || '';
    request.url = '/' + url.split('/').slice(2).join('/');

    try {
      await vmExports.request(request, response);
    } catch (e) {
      instancesLogging.log('error', `${e}`, instance._id || 'unknown_id');
      throw e;
    }
  }
}

export default new ExecutionService();
