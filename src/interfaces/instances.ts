export interface InstanceI {
  [index: string]: any;

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
  [index: string]: any;

  _id?: string;
  name: string;

  files: string;
}

export class Volume {
  id?: string;
  name: string;
  files: any;

  constructor(volume: VolumeI) {
    this.name = volume.name;
    this.files = JSON.parse(volume.files);
    if (volume._id) {
      this.id = volume._id;
    }
  }
}