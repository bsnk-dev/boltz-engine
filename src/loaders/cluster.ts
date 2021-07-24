import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) {
    const w = cluster.fork();

    w.on('death', () => console.error(`Worker ${w.process.pid} died`));

    if (w && w.process && w.process.stdout) w.process.stdout.pipe(process.stdout);
    if (w && w.process && w.process.stderr) w.process.stderr.pipe(process.stderr);
  }
}
