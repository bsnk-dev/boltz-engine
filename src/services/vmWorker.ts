import express from 'express';
import config from './config';
import http from 'http';
import executionRouter from '../api/routers/execute';
import cors from 'cors';
import cluster from 'cluster';
import volumes from './volumes';
import execution from './execution';

/**
 * This file will be manage a single worker that runs any vms sent to it and communicates with the main process
 * for data transfer like volume data, etc. This means it will be running multiple vms on one thread.
 */

class VMWorker {
  app = express();
  port = config.json.executePort;

  constructor() {
    this.app.use(cors());

    this.app.use(executionRouter);
    http.createServer(this.app).listen(this.port);

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
