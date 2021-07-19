import { vol } from "memfs";
import { NodeVM } from "vm2";
import { Volume } from "./instances";

export interface CachedItemI {
  timeLastUsed: number;
  ttl: number;
};

export interface CachedVolumeI extends CachedItemI {
  volume: Volume;
  api: typeof vol;
}

export interface CachedNodeVMI extends CachedItemI {
  nodeVm: NodeVM;
  exports?: any;
  instanceID: string;
  volumeID?: string;
}