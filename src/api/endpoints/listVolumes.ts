import {Request, Response} from 'express';
import database from '../../services/database';

/**
 * API endpoint that lists all volumes.
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function listVolumes(req: Request, res: Response) {
  const allVolumes = await database.getAllVolumes();

  res.status(200).json(allVolumes).end();
}
