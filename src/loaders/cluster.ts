import cluster from 'cluster';
import os from 'os';
import config from '../services/config';

if (cluster.isPrimary) {
  for (let i = 0; i < Math.min(os.cpus().length, config.json.maxWorkerProcesses); i++) {
    const w = cluster.fork();

    w.on('death', (worker) => {
      console.error(`Worker ${worker.process.pid} died`);

      const w = cluster.fork();

      if (w && w.process && w.process.stdout) w.process.stdout.on('data', (data) => {
        console.log(`(${w.process.pid}) ${data}`);
      });
      if (w && w.process && w.process.stderr) w.process.stderr.on('data', (data) => {
        console.log(`(${w.process.pid}) ${data}`);
      });
    });

    if (w && w.process && w.process.stdout) w.process.stdout.on('data', (data) => {
      console.log(`(${w.process.pid}) ${data}`);
    });
    if (w && w.process && w.process.stderr) w.process.stderr.on('data', (data) => {
      console.log(`(${w.process.pid}) ${data}`);
    });
  }
}
