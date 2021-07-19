import Datastore from 'nedb';
import { Instance, InstanceI, Volume } from '../interfaces/instances';
import config from './config';

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
    this.instancesDB = new Datastore({
      filename: (process.env.PRODUCTION ?
        config.json.database.path.production :
        config.json.database.path.development) + 'instances.db',
      autoload: true,
      onload: () => this.loaded.instances = true,
    });

    this.volumesDB = new Datastore({
      filename: (process.env.PRODUCTION ?
        config.json.database.path.production :
        config.json.database.path.development) + 'volumes.db',
      autoload: true,
      onload: () => this.loaded.volumes = true,
    });
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
  async getAllInstances() {
    return this.instancesDB.getAllData();
  }

  /**
   * Returns an instance by it's id
   * @param {string} id
   * @return {InstanceI}
   * @throws {Error}
   */
   async getInstanceById(id: string): Promise<InstanceI | null> {
    return new Promise((resolve, reject) => {
      return this.instancesDB.findOne({ _id: id }, (err, instance) => {
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
    const instance = new Instance({ name: name, volumeID: null });

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
   * Updates the instance's name
   * @param {string} name
   */
   async updateInstanceName(id: string, name: string) {
    return new Promise((resolve, reject) => {
      this.instancesDB.update({ _id: id }, { name: name }, undefined, (err) => {
        if (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Deletes an instance by it's id
   * @param {string} id
   */
  async deleteInstance(id: string) {
    return new Promise((resolve, reject) => {
      this.instancesDB.remove({ _id: id }, (err) => {
        if (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Returns all volumes in the volumes database and strip the files
   * property
   * @return {Volume[]}
   */
  async getAllVolumes() {
    return this.volumesDB.getAllData().map((volume) => {
      volume.files = undefined;
      return volume;
    });
  }

  /**
   * Get volume by its id
   * @param {string} id The id of the volume
   * @return {Volume | null}
   * @throws {Error}
   */
  async getVolumeById(id: string): Promise<Volume> {
    return new Promise((resolve, reject) => {
      this.volumesDB.findOne({ _id: id }, (err, volume) => {
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
   * @param {any} files The files to be stored in the volume, represented as an object
   * @return {string} The id of the volume
   */
  async createOrUpdateVolume(id: string, name: string, files: any) {
    const volume = new Volume({ name, files });

    return new Promise((resolve, reject) => {
      if (id) {
        this.volumesDB.update({ _id: id }, volume, undefined, (err) => {
          if (err) {
            reject(err);
          }
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
      this.volumesDB.remove({ _id: id }, (err) => {
        if (err) {
          reject(err);
        }
      });
    });
  }
}


export default new DatabaseService();
