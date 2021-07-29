import {Request, Response} from 'express';
import database from '../../services/database';
import execution from '../../services/execution';
import LogManager from '../../services/logManager';

/**
 * Updates an instances details
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function updateInstance(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['updateInstance']);

  const error = await database.updateInstance(req.body.id, req.body.instance).catch((err) => {
    res.status(500).end();
    return logs.logError(`Failed to update instance, ${err}`).end();
  });

  if (error instanceof Error) return;

  await execution.reinitalizeInstancesWithID(req.body.id);

  res.status(204).end();
}
