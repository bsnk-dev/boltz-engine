// start the database for child processes to connect to

import cp from 'child_process';
import config from '../services/config';
import cluster from 'cluster';

if (cluster.isPrimary) {
  cp.execFile('./node_modules/nedb-multi/server.js', [config.json.dbPort.toString()], {});
}

import './cluster';