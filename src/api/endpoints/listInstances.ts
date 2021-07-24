import {Request, Response} from 'express';
import database from '../../services/database';

/**
 * API endpoint that lists all instances.
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function listInstances(req: Request, res: Response) {
  const allInstances = await database.getAllInstances();

  res.status(200).json(allInstances).end();
}
