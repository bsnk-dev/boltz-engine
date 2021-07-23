import {Router} from 'express';
import executeFunction from '../endpoints/executeFunction';

const executionRouter = Router();

executionRouter.get('/:id/', executeFunction);

export default executionRouter;
