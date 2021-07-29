import {Request, Response} from 'express';
import pidusage from 'pidusage';
import LogManager from '../../services/logManager';
import cluster from 'cluster';
import os from 'os';
import fastFolderSize from 'fast-folder-size';

/**
 * Get's the server's load in memory.
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function getServerLoad(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['deleteVolume']);

  let totalMemoryUsage = 0;
  let totalCPUUsage = 0;

  totalMemoryUsage += (await pidusage(process.pid)).memory;
  totalCPUUsage += (await pidusage(process.pid)).cpu;

  if (cluster.workers) {
    for (const [index, worker] of Object.entries(cluster.workers)) {
      if (worker && worker.process.pid) {
        const usage = await pidusage(worker.process.pid);

        totalMemoryUsage += usage.memory;
        totalCPUUsage += usage.cpu;
      }
    }
  }

  const totalCores = os.cpus().length;
  const totalMemory = os.totalmem();
  const vmPackagesSize = await new Promise((resolve) => {
    fastFolderSize('./sandbox', (err, size) => {
      if (size) {
        resolve(size); return;
      }
      resolve(0);
    });
  });

  res.status(200).json({
    totalMemoryUsage,
    totalCPUUsage,
    totalCores,
    totalMemory,
    vmPackagesSize,
  }).end();
}
