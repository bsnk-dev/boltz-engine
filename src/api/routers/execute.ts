import {Router} from 'express';
import executeFunction from '../endpoints/executeFunction';

const executionRouter = Router();

executionRouter.all('/:id/', executeFunction);

export default executionRouter;
