import config from './config';
import http from 'http';
import cluster from 'cluster';
import volumes from './volumes';
import execution from './execution';
import executeFunction from '../api/endpoints/executeFunction';

/**
 * This file will be manage a single worker that runs any vms sent to it and communicates with the main process
 * for data transfer like volume data, etc. This means it will be running multiple vms on one thread.
 */

/**
 * Sets up the worker process to execute vms.
 */
class VMWorker {
  port = config.json.executePort;

  /**
   * Starts a server and listens for volue reloads requests
   */
  constructor() {
    http.createServer((req, res) => {
      executeFunction(req, res);
    }).listen(this.port);

    console.log(`Listening for execution requests on port ${config.json.executePort} from worker ${process.pid}`);

    if (cluster.isWorker) {
      process.on('message', async (msg: any) => {
        if (msg.type === 'reloadVolume') {
          await volumes.reloadVolume(msg.id);
          await execution.reinitalizeInstancesUsingVolume(msg.id);
        }
      });
    }
  }
}

export default VMWorker;
