import cluster from 'cluster';
import os from 'os';
import config from '../services/config';

if (cluster.isPrimary) {
  for (let i = 0; i < Math.min(os.cpus().length, config.json.maxWorkerProcesses); i++) {
    const w = cluster.fork();

    w.on('death', (worker) => {
      console.error(`Worker ${worker.process.pid} died`);

      cluster.fork();
    });
  }
}
