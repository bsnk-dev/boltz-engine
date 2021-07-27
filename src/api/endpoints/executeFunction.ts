import database from '../../services/database';
import execution from '../../services/execution';
import LogManager from '../../services/logManager';
import cacheTTL from 'map-cache-ttl';
import {IncomingMessage, ServerResponse} from 'http';

const idCache = new cacheTTL('8s', '30s');

/**
 * Lets a function respond to the request
 * @param {Request} req the request
 * @param {Response} res the response
 */
export default async function executeFunction(req: IncomingMessage, res: ServerResponse) {
  if (!req.url) return;

  const functionID = req.url.split('/')[1];

  if (!functionID) {
    res.statusCode = 403;
    res.end('Invalid URL!');
    return;
  }

  let instance;

  if (idCache.has(functionID)) {
    instance = idCache.get(functionID);
  } else {
    instance = await database.getInstanceByIdOrName(undefined, functionID).catch((error) => {
      const logs = new LogManager();
      logs.updateContext('api', ['execute', functionID]);

      logs.logError(`Failed to get instance of called function ${functionID}, ${error}`);
      res.statusCode = 200;
      res.end();
      return;
    });

    idCache.set(functionID, instance);
  }

  if (!instance) {
    const logs = new LogManager();
    logs.updateContext('api', ['execute', functionID]);

    logs.logError(`Failed to get instance of called function ${functionID}, instance not found`);
    res.statusCode = 404;
    res.end();
    return;
  }

  await execution.execute(instance, req, res).catch((error: Error) => {
    const logs = new LogManager();
    logs.updateContext('api', ['execute', functionID]);

    logs.logError(`Failed to execute function ${functionID}, ${error}. STACK: ${error.stack}`);
    res.statusCode = 500;
    res.end();
    return;
  });
}
