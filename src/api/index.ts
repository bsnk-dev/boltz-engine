import express from 'express';
import cors from 'cors';
import adminRouter from './routers/admin';
import config from '../services/config';
import {errors} from 'celebrate';
import cluster from 'cluster';
import {join} from 'path';
import https from 'https';
import http from 'http';
import {readFileSync} from 'fs';

if (cluster.isPrimary) {
  const adminApp = express();
  adminApp.use(express.json());
  adminApp.use(cors());

  adminApp.use('/admin', adminRouter);


  adminApp.use(express.static('./public'));
  adminApp.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', '..', '..', './public', 'index.html'));
  });

  adminApp.use(errors());
  
  if (config.json.ssl.enabled) {
    https.createServer({ 
      key: readFileSync(config.json.ssl.keyPath[(process.env.production == 'true') ? 'production' : 'development']).toString(),
      cert: readFileSync(config.json.ssl.certPath[(process.env.production == 'true') ? 'production' : 'development']).toString(),
      passphrase: config.secrets.ssl.passphrase,
    }, adminApp).listen(config.json.adminPort);
  } else {
    http.createServer(adminApp).listen(config.json.adminPort);
  }

  console.log(`Listening for admin actions on port ${config.json.adminPort}`);
}
