import { Request, Response } from 'express';
import database from '../../services/database';
import LogManager from '../../services/logManager';

/**
 * Deletes an volume
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function deleteVolume(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['deleteVolume']);

  const { id } = req.body;

  await database.deleteVolume(id).catch(error => {
    logs.logError(`Failed to delete volume ${id}, ${error}`);
    res.status(500).end();
    return;
  });

  res.status(204).end();
}