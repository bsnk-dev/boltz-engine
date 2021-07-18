import express from 'express';
import cors from 'cors';
import adminRouter from './routers/admin';
import config from '../services/config';

const app = express();
app.use(cors());

app.use('/admin', adminRouter);

app.listen(config.json.adminPort);
