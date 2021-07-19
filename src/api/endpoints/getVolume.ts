import {Request, Response} from 'express';
import database from '../../services/database';
import LogManager from '../../services/logManager';

/**
 * Get's the metadata and files of a volume.
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function getVolume(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['getVolume']);
  
  const {id} = req.query;

  const volume = await database.getVolumeById(id as string).catch((e) => {
    logs.logError(`Failed to retrieve volume information, ${e}`);
    res.status(500).end();
    return;
  });

  if (!volume) {
    res.status(404).end();
    return;
  }

  res.status(200).json(volume).end();
}
