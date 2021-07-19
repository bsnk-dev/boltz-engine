import { Request, Response } from 'express';
import database from '../../services/database';
import LogManager from '../../services/logManager';

/**
 * Updates an instances details
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function updateInstance(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['updateInstance']);

  const instance = await database.updateInstanceName(req.body.id, req.body.name).catch(err => {
    logs.logError(`Failed to update instance, ${err}`);
    res.status(500).end();
    return;
  });

  res.status(204).end();
}