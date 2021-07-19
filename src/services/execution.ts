import { NodeVM } from "vm2";
import { Volume as Vol, vol } from 'memfs';
import { InstanceI, Volume, VolumeI } from "../interfaces/instances";
import database from "./database";
import LogManager from '../services/logManager';
import config from "./config";
import { Request, Response } from "express";

interface CachedItemI {
  timeLastUsed: number;
  ttl: number;
};

interface CachedVolumeI extends CachedItemI {
  volume: VolumeI;
  api: typeof vol;
}

interface CachedNodeVMI extends CachedItemI {
  nodeVm: NodeVM;
  exports?: any;
  instanceID: string;
}

/**
 * Handles the execution of specific cloud functions and vm management
 */
class ExecutionService {
  private inMemoryVolumes: CachedVolumeI[] = [];
  private inMemoryVMs: CachedNodeVMI[] = [];

  private logs = new LogManager().updateContext('ExecutionService');

  /**
   * Garbage collect unsed cached volumes and vms
   */
  private gc() {
    this.inMemoryVolumes = this.inMemoryVolumes.filter(volume => {
      if (volume.timeLastUsed < Date.now() - volume.ttl) {
        return false;
      }
      return true;
    });

    this.inMemoryVMs = this.inMemoryVMs.filter(vm => {
      if (vm.timeLastUsed < Date.now() - vm.ttl) {
        return false;
      }
      return true;
    });
  }

  /**
   * Gets a volume, and if it's cached returns that
   */
  private async getVolume(volumeID: string): Promise<typeof vol> {
    const cachedVolume = this.inMemoryVolumes.find(vol => {
      return vol.volume._id === volumeID;
    });

    if (cachedVolume) {
      cachedVolume.timeLastUsed = Date.now();
      return cachedVolume.api;
    }

    const volumeData = await database.getVolumeById(volumeID).catch(err => {
      throw this.logs.error(`Failed to retrieve volume, ${err}`);
    });

    if (!volumeData) {
      throw this.logs.error(`Failed to retrieve volume, ${volumeID} not found`);
    }

    const volume = new Volume(volumeData);
    const loadedVolume = Vol.fromJSON(volume.files);

    this.inMemoryVolumes.push({
      volume,
      api: loadedVolume,
      timeLastUsed: Date.now(),
      ttl: config.json.execution.ttl.volumes,
    });

    return loadedVolume;
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
  private async initalize(instance: InstanceI): Promise<any> {
    const volume = await this.getVolume(instance.volumeID || '');
    const vm = await this.getVM(instance._id || '', volume);

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

    if (cachedVM) cachedVM.exports = vmExports;

    return vmExports;
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
