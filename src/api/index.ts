import express from 'express';
import cors from 'cors';
import adminRouter from './routers/admin';
import config from '../services/config';
import executionRouter from './routers/execute';
import {errors} from 'celebrate';

const adminApp = express();
adminApp.use(express.json());
adminApp.use(cors());

adminApp.use('/admin', adminRouter);
adminApp.use(errors());

adminApp.listen(config.json.adminPort);
console.log(`Listening for admin actions on port ${config.json.adminPort}`);

const executionApp = express();
executionApp.use(cors());

executionApp.use(executionRouter);
executionApp.use(errors());

executionApp.listen(config.json.executePort);
console.log(`Listening for execution requests on port ${config.json.executePort}`);
