import {Request, Response} from 'express';
import instancesLogging from '../../services/instancesLogging';
import LogManager from '../../services/logManager';

/**
 * Deletes logs for a specific instance
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function deleteLogs(req: Request, res: Response) {
  const logsOrError = await instancesLogging.deleteLogs(req.query.id as string).catch((err) => {
    return new LogManager().updateContext('api', ['deleteLogs']).logError(`Failed to delete logs for ${req.query.id}, ${err}`).throw();
  });

  if (logsOrError instanceof Error) {
    return res.status(500).end();
  }

  res.status(204).end();
}
