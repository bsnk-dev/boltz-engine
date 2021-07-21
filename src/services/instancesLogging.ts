import Logger from 'nedb-logger';
import Datastore from 'nedb';
import config from './config';

type Severity = 'info' | 'warn' | 'error';
interface LogI {
  _id?: string;
  severity: Severity;
  message: string;
  timestamp: number;
};

class InstancesLoggingService {
  logger = new Logger({ filename: 
    (process.env.production == 'true') ? 
    config.json.database.path.production+'vm-logs.db' : 
    config.json.database.path.development+'vm-logs.db' });

  lastAccessedLogs = 0;
  tmpNedb: Datastore<LogI> | null = null;
  tmpNedbTTL = 120000;

  log(severity: Severity, message: string, instanceID: string) {
    this.logger.insert({ severity, message, instanceID, timestamp: Date.now() });

    if (this.lastAccessedLogs > Date.now() + this.tmpNedbTTL) {
      this.tmpNedb = null;
    }
  }

  private get logDB() {
    if (
      this.tmpNedb == undefined ||
      this.lastAccessedLogs > Date.now() + this.tmpNedbTTL
    ) {
      this.tmpNedb = new Datastore({
        filename: (process.env.production == 'true') ? 
        config.json.database.path.production+'vm-logs.db' : 
        config.json.database.path.development+'vm-logs.db',
        autoload: true
      });
    } else {
      this.tmpNedb.loadDatabase();
    }

    this.lastAccessedLogs = Date.now();
    return this.tmpNedb;
  }

  async getLogs(instanceID: string, severity?: Severity) {
    return new Promise((resolve, reject) => {
      const query: {instanceID: string; severity?: Severity} = { instanceID };
      if (severity) query.severity = severity;

      this.logDB.find(query, (err: Error, logs: LogI[]) => {
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
