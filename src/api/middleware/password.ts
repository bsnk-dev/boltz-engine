import config from '../../services/config';
import {Request, Response} from 'express';

/**
 * express middleware that checks the password against the one stored in the
 * config.json
 * @param {Request}   req  the request object
 * @param {Response}  res  the response object
 * @param {Function} next the next middleware function to call
 */
export default function password(req: Request, res: Response, next: Function) {
  if (req.headers.authorization !== ('Basic ' + config.secrets.authentication.password)) {
    res.status(401).send('Wrong password.');
  } else {
    next();
  }
}
