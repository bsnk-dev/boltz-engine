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

  const { id } = req.body;

  await database.deleteInstance(id).catch(error => {
    logs.logError(`Failed to delete instance ${id}, ${error}`);
    res.status(500).end();
    return;
  });

  res.status(204).end();
}