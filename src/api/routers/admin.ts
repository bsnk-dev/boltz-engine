import {Router} from 'express';
import password from '../middleware/password';

const adminRouter = Router();

adminRouter.use('/listInstances', password,);
