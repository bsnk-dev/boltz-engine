export interface InstanceI {
  _id?: string;
  name: string;
  volumeID: string | null;
}

export class Instance implements InstanceI {
  _id?: string;
  name: string;
  volumeID: string | null;

  constructor(instance: Instance) {
    this.name = instance.name;
    this.volumeID = instance.volumeID;
  }
}

export interface VolumeI {
  _id?: string;
  name: string;

  files: any;
}

export class Volume implements VolumeI {
  _id?: string;
  name: string;
  files: any;

  constructor(volume: Volume) {
    this.name = volume.name;
    this.files = volume.files;
  }
}
