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

class InstancesLoggingService {
  logger: Datastore = new DatastoreLinked({ filename: 
    (process.env.production == 'true') ? 
    config.json.database.path.production+'vm-logs.db' : 
    config.json.database.path.development+'vm-logs.db' });

  log(severity: Severity, message: string, instanceID: string) {
    this.logger.insert({ severity, message, instanceID, timestamp: Date.now() });
  }

  async getLogs(instanceID: string, severity?: Severity) {
    return new Promise((resolve, reject) => {
      const query: {instanceID: string; severity?: Severity} = { instanceID };
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
