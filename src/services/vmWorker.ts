import config from './config';
import http from 'http';
import https from 'https';
import cluster from 'cluster';
import volumes from './volumes';
import execution from './execution';
import executeFunction from '../api/endpoints/executeFunction';
import {readFileSync} from 'fs';

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
    this.patchConsoleLog();

    if (config.json.ssl.enabled) {
      https.createServer({ 
        key: readFileSync(config.json.ssl.keyPath[(process.env.production == 'true') ? 'production' : 'development']).toString(),
        cert: readFileSync(config.json.ssl.certPath[(process.env.production == 'true') ? 'production' : 'development']).toString(),
        passphrase: config.secrets.ssl.passphrase,
      }, executeFunction).listen(this.port);
    } else {
      http.createServer(executeFunction).listen(this.port);
    }

    console.log(`Listening for execution requests on port ${config.json.executePort}`);

    if (cluster.isWorker) {
      process.on('message', async (msg: any) => {
        if (msg.type === 'reloadVolume') {
          await volumes.reloadVolume(msg.id);
          await execution.reinitalizeInstancesUsingVolume(msg.id);
        }
      });
    }
  }

  private patchConsoleLog() {
    const oldConsoleLog = Object.assign(console.log);
    const oldConsoleError = Object.assign(console.error);

    console.log = (...args: any[]) => {
      oldConsoleLog(`(${process.pid})`, ...args);
    };

    console.error = (...args: any[]) => {
      oldConsoleError(`(${process.pid})`, ...args);
    };
  }
}

export default VMWorker;
