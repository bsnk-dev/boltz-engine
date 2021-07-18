import Datastore from 'nedb';
import {Instance, Volume} from '../interfaces/instances';
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
        config.json.database.productionPath :
        config.json.database.developmentPath)+'instances.db',
      autoload: true,
      onload: () => this.loaded.instances = true,
    });

    this.volumesDB = new Datastore({
      filename: (process.env.PRODUCTION ?
        config.json.database.productionPath :
        config.json.database.developmentPath)+'volumes.db',
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
  getAllInstances() {
    return this.instancesDB.getAllData();
  }

  /**
   * Returns an instance by it's id
   * @param {string} id
   * @return {Instance}
   * @throws {Error}
   */
  getInstanceById(id: string) {
    return this.instancesDB.findOne({_id: id}, (err, instance) => {
      if (err) {
        throw err;
      }
      return instance;
    });
  }

  /**
   * Get volume by its id
   * @param {string} id
   * @return {Volume}
   * @throws {Error}
   */
  getVolumeById(id: string) {
    return this.volumesDB.findOne({_id: id}, (err, volume) => {
      if (err) {
        throw err;
      }
      return volume;
    });
  }
}


export default new DatabaseService();
