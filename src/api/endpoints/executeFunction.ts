import {Request, Response} from 'express';
import database from '../../services/database';
import execution from '../../services/execution';
import LogManager from '../../services/logManager';

/**
 * Lets a function respond to the request
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function executeFunction(req: Request, res: Response) {
  const functionID = req.params.id;
  const query = req.query;

  const logs = new LogManager();
  logs.updateContext('api', ['execute', functionID]);

  const instance = await database.getInstanceById(functionID).catch(error => {
    logs.logError(`Failed to get instance of called function ${functionID}, ${error}`);
    res.status(500).end();
    return;
  });

  if (!instance) {
    logs.logError(`Failed to get instance of called function ${functionID}, instance not found`);
    res.status(404).end();
    return;
  }

  await execution.execute(instance, req, res).catch((error: Error) => {
    logs.logError(`Failed to execute function ${functionID}, ${error}. STACK: ${error.stack}`);
    res.status(500).end();
    return;
  });
}