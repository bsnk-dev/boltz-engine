import express from 'express';
import cors from 'cors';
import adminRouter from './routers/admin';
import config from '../services/config';
import {errors} from 'celebrate';
import cluster from 'cluster';
import {join} from 'path';

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

  adminApp.listen(config.json.adminPort);
  console.log(`Listening for admin actions on port ${config.json.adminPort}`);
}
