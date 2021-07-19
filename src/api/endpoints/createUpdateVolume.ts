import {Request, Response} from 'express';
import database from '../../services/database';
import LogManager from '../../services/logManager';

/**
 * Creates a new volume
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function createOrUpdateVolume(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['createVolume']);

  const {id, name, files} = req.body;

  const volumeID = await database.createOrUpdateVolume(id, name, files)
      .catch((e) => {
        logs.logError(`Failed to create/update volume, ${e}`)
        res.status(500).end();
        return;
      });
  
  res.status(201).json({
    volumeID
  }).end();
}