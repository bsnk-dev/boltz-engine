import { Request, Response } from 'express';
import database from '../../services/database';
import LogManager from '../../services/logManager';

/**
 * Deletes an instances
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function deleteInstance(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['deleteInstance']);

  const { instanceId } = req.body;

  await database.deleteInstance(instanceId).catch(error => {
    logs.logError(`Failed to delete instance ${instanceId}, ${error}`);
    res.status(500).end();
    return;
  });

  res.status(204).end();
}