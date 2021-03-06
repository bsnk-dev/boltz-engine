// @ts-ignore NEDB-multi doesn't have types
import DatastoreConnector from 'nedb-multi';
import Datastore from '../interfaces/nedb-multi';
import {Instance, InstanceI, Volume, VolumeI} from '../interfaces/instances';
import config from './config';

const DatastoreLinked = DatastoreConnector(config.json.dbPort);

/**
 * Controls access to the database.
 */
class DatabasePlatform {
  instancesDB!: Datastore<Instance>;
  volumesDB!: Datastore<Volume>;

  loaded = {
    instances: false,
    volumes: false,
  };

  /**
   * Loads all of the database files into the service
   */
  loadDatabase() {
    this.instancesDB = new DatastoreLinked({
      filename: (process.env.PRODUCTION ?
        config.json.database.path.production :
        config.json.database.path.development) + 'instances.db',
      autoload: true,
      onload: () => this.loaded.instances = true,
    });

    this.instancesDB.loadDatabase();

    this.volumesDB = new DatastoreLinked({
      filename: (process.env.PRODUCTION ?
        config.json.database.path.production :
        config.json.database.path.development) + 'volumes.db',
      autoload: true,
      onload: () => this.loaded.volumes = true,
    });

    this.volumesDB.loadDatabase();
  }

  /**
   * Loads the database
   */
  constructor() {
    this.loadDatabase();
  }
}

/**
 * Performs actions on the database as a global singleton.
 */
class DatabaseService extends DatabasePlatform {
  /**
   * Returns all instances in the instances database
   * @return {Instance[]}
   */
  async getAllInstances(): Promise<InstanceI[]> {
    return new Promise((resolve, reject) => {
      this.instancesDB.find({}, (err: Error, instances: InstanceI[]) => {
        if (err) {
          reject(err);
        }
        resolve(instances);
      });
    });
  }

  /**
   * Returns an instance by it's id or name
   * @param {string} idOrName
   * @return {InstanceI}
   * @throws {Error}
   */
  async getInstanceByIdOrName(idOrName: string): Promise<InstanceI | null> {
    const idResult = await this.getInstanceById(idOrName);

    if (idResult !== null) {
      return idResult;
    } else {
      const nameResult = await this.getInstanceByName(idOrName);
      return nameResult;
    }
  }

  /**
   * Returns an instance by it's id
   * @param {string} id
   * @return {InstanceI}
   * @throws {Error}
   */
  async getInstanceById(id: string): Promise<InstanceI | null> {
    return new Promise((resolve, reject) => {
      return this.instancesDB.findOne({_id: id}, (err, instance) => {
        if (err) {
          reject(err);
        }
        resolve(instance);
      });
    });
  }

  /**
   * Returns an instance by it's name
   * @param {string} name
   * @return {InstanceI}
   * @throws {Error}
   */
  async getInstanceByName(name: string): Promise<InstanceI | null> {
    return new Promise((resolve, reject) => {
      return this.instancesDB.findOne({name}, (err, instance) => {
        if (err) {
          reject(err);
        }
        resolve(instance);
      });
    });
  }

  /**
   * Creates a new instance with a name and returns it's id
   * @param {string} name The name of the instance
   * @return {string}
   */
  async createInstance(name: string) {
    const instance = new Instance({name: name, volumeID: null});

    return new Promise((resolve, reject) => {
      this.instancesDB.insert(instance, (err, newInstance) => {
        if (err) {
          reject(err);
        }
        resolve(newInstance._id);
      });
    });
  }

  /**
   * Updates an instances details
   * @param {string} id The id of the instance
   * @param {InstanceI} instance The new instance details
   */
  async updateInstance(id: string, instance: InstanceI) {
    const updatedDetails: InstanceI = {
      name: instance.name,
      volumeID: instance.volumeID,
    };

    // remove undefined values from updatedDetails
    const updatedInstance: Partial<InstanceI> = {};
    for (const key in updatedDetails) {
      if (updatedDetails[key] !== undefined) {
        updatedInstance[key] = updatedDetails[key];
      }
    }

    return new Promise((resolve, reject) => {
      this.instancesDB.update({_id: id}, {$set: {...updatedInstance}}, {}, (err) => {
        if (err) {
          reject(err);
        }

        resolve(undefined);
      });
    });
  }

  /**
   * Deletes an instance by it's id
   * @param {string} id
   */
  async deleteInstance(id: string) {
    return new Promise((resolve, reject) => {
      this.instancesDB.remove({_id: id}, (err) => {
        if (err) {
          reject(err);
        }

        resolve(undefined);
      });
    });
  }

  /**
   * Returns all volumes in the volumes database and strip the files
   * property
   * @return {VolumeI[]}
   */
  async getAllVolumes() {
    const volumes: VolumeI[] = await new Promise((resolve, reject) => {
      this.volumesDB.find({}, (err: Error, vols: VolumeI[]) => {
        if (err) {
          reject(err);
        }
        resolve(vols);
      });
    });

    const newVolumes: VolumeI[] = [];

    for (const volume of volumes) {
      newVolumes.push({
        name: volume.name,
        files: '',
        _id: volume._id,
      });
    }

    return newVolumes;
  }

  /**
   * Get volume by its id
   * @param {string} id The id of the volume
   * @return {Volume | null}
   * @throws {Error}
   */
  async getVolumeById(id: string): Promise<Volume> {
    return new Promise((resolve, reject) => {
      this.volumesDB.findOne({_id: id}, (err, volume) => {
        if (err) {
          reject(err);
        }
        resolve(volume);
      });
    });
  }

  /**
   * Creates or updates a volume by it's id
   * @param {string?} id The id of the volume, if undefined, it creates a new volume
   * @param {string} name The name of the volume
   * @param {string} files The files to be stored in the volume, represented as stringified json
   * @return {string} The id of the volume
   */
  async createOrUpdateVolume(id: string, name: string, files: string) {
    const volume: VolumeI = {name, files};

    // removes undefined values from volume
    const cleanVolume: Partial<VolumeI> = {};
    for (const key in volume) {
      if (volume[key] !== undefined) {
        cleanVolume[key] = volume[key];
      }
    }

    return new Promise((resolve, reject) => {
      if (id) {
        this.volumesDB.update({_id: id}, {$set: {...cleanVolume}}, {}, (err) => {
          if (err) {
            reject(err);
          }

          resolve(id);
        });
      } else {
        this.volumesDB.insert(volume, (err, newVolume) => {
          if (err) {
            reject(err);
          }
          resolve(newVolume._id);
        });
      }
    });
  }

  /**
   * Deletes a volume by its id
   * @param {string} id The id of the volume
   * @throws {Error}
   */
  async deleteVolume(id: string) {
    return new Promise((resolve, reject) => {
      this.volumesDB.remove({_id: id}, (err) => {
        if (err) {
          reject(err);
        }

        resolve(undefined);
      });
    });
  }
}


export default new DatabaseService();
