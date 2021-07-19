import { NodeVM } from "vm2";
import { vol } from 'memfs';
import { InstanceI } from "../interfaces/instances";
import LogManager from '../services/logManager';
import config from "./config";
import { Request, Response } from "express";
import { CachedNodeVMI } from "../interfaces/caching";
import volumes from "./volumes";
import database from "./database";

/**
 * Handles the execution of specific cloud functions and vm management
 */
class ExecutionService {
  private inMemoryVMs: CachedNodeVMI[] = [];

  private logs = new LogManager().updateContext('ExecutionService');

  /**
   * Garbage collect unsed cached volumes and vms
   */
  private gc() {
    this.inMemoryVMs = this.inMemoryVMs.filter(vm => {
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
   */
  private async getVM(instanceID: string, volume: typeof vol): Promise<NodeVM> {
    const cachedVM = this.inMemoryVMs.find(vm => {
      return vm.instanceID === instanceID;
    });

    if (cachedVM) {
      cachedVM.timeLastUsed = Date.now();
      return cachedVM.nodeVm;
    }

    const newVM = new NodeVM({
      require: {
        external: true,
        builtin: ['*'],
        mock: {
          fs: volume,
        },
        root: (process.env.production == 'true') ?
          config.json.execution.vms.sandboxDirectory.production :
          config.json.execution.vms.sandboxDirectory.development,
        context: 'sandbox',
      },
      console: 'off',
    });

    this.inMemoryVMs.push({
      nodeVm: newVM,
      instanceID,
      timeLastUsed: Date.now(),
      ttl: config.json.execution.ttl.vms,
    });

    return newVM;
  }

  private async getVMExports(instanceID: string): Promise<any> {
    const cachedVM = this.inMemoryVMs.find(vm => {
      return vm.instanceID === instanceID;
    });

    if (cachedVM?.exports) return cachedVM.exports;

    return null;
  }


  /**
   * Initalize a cloud function
   */
  public async initalize(instance: InstanceI): Promise<any> {
    const volume = await volumes.getVolume(instance.volumeID || '');
    const vm = await this.getVM(instance._id || '', volume);

    this.logs.log(`Initalizing VM ${instance._id}`);

    /**
     * So the vm has access to the in memory volume
     */
    const patchedRequire = (`
      (() => {
        const _filesystemVolume = require('fs');
        const oldRequire = Object.assign(require);

        patchedRequire.cache = Object.create(null);

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

    const vmExports = vm.run(`${patchedRequire} ${indexJS}`);

    const cachedVM =
      this.inMemoryVMs.find(vm => {
        return vm.instanceID === instance._id;
      });

    if (cachedVM) {
      cachedVM.exports = vmExports;
      cachedVM.volumeID = instance.volumeID || undefined;
    }

    return vmExports;
  }

  public async reinitalizeInstancesUsingVolume(volumeID: string): Promise<void> {
    for (const instance of this.inMemoryVMs) {
      if (instance.volumeID === volumeID) {
        const instanceData = await database.getInstanceById(instance.instanceID);
        if (!instanceData) {
          this.logs.log(`Instance in memory ${instance.instanceID} not found in database`);
          continue;
        }
        
        this.initalize(instanceData);
      } 
    }
  }

  /**
   * Executes the cloud function in the vm
   */
  public async execute(instance: InstanceI, request: Request, response: Response): Promise<any> {
    const cachedVM = this.inMemoryVMs.find(vm => {
      return vm.instanceID === instance._id;
    });

    if (!cachedVM) {
      await this.initalize(instance);
    }

    const vmExports = await this.getVMExports(instance._id || '');

    if (!vmExports) {
      throw new Error(`VM exports not found for instance ${instance._id}`);
    }

    await vmExports.request(request, response);
  }
}

export default new ExecutionService();
