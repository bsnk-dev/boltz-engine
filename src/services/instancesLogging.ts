// @ts-ignore
import DatastoreConnector from 'nedb-multi';
import Datastore from 'nedb';
import config from './config';

const DatastoreLinked = DatastoreConnector(config.json.dbPort);

type Severity = 'info' | 'warn' | 'error';
interface LogI {
  _id?: string;
  severity: Severity;
  message: string;
  timestamp: number;
};

/**
 * Logs instances to central database to be viewed in the admin interface
 */
class InstancesLoggingService {
  logger: Datastore = new DatastoreLinked({filename:
    (process.env.production == 'true') ?
    config.json.database.path.production+'vm-logs.db' :
    config.json.database.path.development+'vm-logs.db'});

  /**
   * Loads the database from the server
   */
  constructor() {
    this.logger.loadDatabase();
  }

  /**
   * Makes a new log entry
   * @param {string} severity - severity of the log
   * @param {string} message - message to be logged
   * @param {string} instanceID - instanceID of the VM
   * @return {undefined}
   */
  log(severity: Severity, message: string, instanceID: string) {
    this.logger.insert({severity, message, instanceID, timestamp: Date.now()});
  }

  /**
   * Gets all logs from the database for an instance
   * @param {string} instanceID - instanceID of the VM
   * @param {Severity} severity - severity of the log
   * @return {Promise<LogI[]>} - array of logs
   */
  async getLogs(instanceID: string, severity?: Severity) {
    return new Promise((resolve, reject) => {
      const query: {instanceID: string; severity?: Severity} = {instanceID};
      if (severity) query.severity = severity;

      this.logger.find(query, (err: Error, logs: LogI[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(logs);
        }
      });
    });
  }
}

export default new InstancesLoggingService();
