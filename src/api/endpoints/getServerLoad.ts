import { Request, Response } from 'express';
import v8 from 'v8';
import LogManager from '../../services/logManager';

/**
 * Get's the server's load in memory.
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function deleteVolume(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['deleteVolume']);

  const results = v8.getHeapStatistics();

  if (!results) return;

  res.status(200).json({
    total_heap_size: results.total_heap_size,
    heap_size_limit: results.heap_size_limit,
  }).end();
}
