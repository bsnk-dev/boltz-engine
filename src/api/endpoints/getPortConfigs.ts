import {Request, Response} from 'express';
import config from '../../services/config';

/**
 * Gives the execution port for where to connect to cloud functions
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {void}
 */
export default function(req: Request, res: Response) {
  res.status(200).json({
    executionPort: config.json.executePort,
  }).end();
}
