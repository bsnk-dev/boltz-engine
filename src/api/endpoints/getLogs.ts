import {Request, Response} from 'express';
import instancesLogging from '../../services/instancesLogging';

/**
 * Gets logs for a specific instance
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function getLogs(req: Request, res: Response) {
  const logs = await instancesLogging.getLogs(req.query.id as string);

  res.status(200).json(logs).end();
}
