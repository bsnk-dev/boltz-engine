export interface InstanceI {
  [index: string]: any;

  _id?: string;
  name: string;
  volumeID: string | null;
}

/**
 * @class Instance
 * @classdesc Represents an Instance data that can be used to start a vm
 */
export class Instance implements InstanceI {
  _id?: string;
  name: string;
  volumeID: string | null;

  /**
   * @constructor
   * @param {InstanceI} instance Instance data
   */
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

/**
 * @class Volume
 * @classdesc Represents a Volume data that can be used to create a volume in memory
 */
export class Volume {
  id?: string;
  name: string;
  files: any;

  /**
   * @constructor
   * @param {VolumeI} volume Volume data
   */
  constructor(volume: VolumeI) {
    this.name = volume.name;
    this.files = JSON.parse(volume.files);
    if (volume._id) {
      this.id = volume._id;
    }
  }
}
