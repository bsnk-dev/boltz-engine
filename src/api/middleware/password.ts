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
  // checks base64 basic auth against username and password
  if (req.headers.authorization) {
    const basic = req.headers.authorization.split(' ');
    if (basic[0] === 'Basic') {
      const credentials = new Buffer(basic[1], 'base64').toString().split(':');
      if (credentials[1] === config.secrets.authentication.password /*&& credentials[1] === config.secrets.authentication.username*/) {
        next();
        return;
      }
    }
  }

  // if no authorization header is present, send a 401 response that enables basic auth
  res.status(401).send({
    error: 'Unauthorized',
    message: 'Please provide a valid username and password'
  }).end();
}
