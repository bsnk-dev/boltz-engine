import {Request, Response} from 'express';
import database from '../../services/database';
import LogManager from '../../services/logManager';

/**
 * Creates a new instance
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function createInstance(req: Request, res: Response) {
  const logs = new LogManager();
  logs.updateContext('api', ['createInstance']);

  const instanceID = await database.createInstance(req.body.name)
      .catch((e) => {
        logs.logError(`Failed to create new instance, ${e}`);
        res.status(500).end();
        return;
      });

  res.status(201).json({
    instanceID: instanceID,
  }).end();
}
