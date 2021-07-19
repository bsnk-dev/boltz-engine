import express from 'express';
import cors from 'cors';
import adminRouter from './routers/admin';
import config from '../services/config';
import executionRouter from './routers/execute';

const adminApp = express();
adminApp.use(cors());

adminApp.use('/admin', adminRouter);

adminApp.listen(config.json.adminPort);
console.log(`Listening for admin actions on port ${config.json.adminPort}`);

const executionApp = express();
executionApp.use(cors());

executionApp.use(executionRouter);

executionApp.listen(config.json.executePort);
console.log(`Listening for execution requests on port ${config.json.executePort}`);
