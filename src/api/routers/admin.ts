import {Router} from 'express';
import createInstance from '../endpoints/createInstance';
import listInstances from '../endpoints/listInstances';
import password from '../middleware/password';

const adminRouter = Router();

adminRouter.use('/listInstances', password, listInstances);


export default adminRouter;
