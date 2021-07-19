import {Router} from 'express';
import executeFunction from '../endpoints/executeFunction';

const executionRouter = Router();
executionRouter.use('/:id/', (req, res, next) => {
  console.info(`[api/execution] Executing function ${req.params.id}`);
  next();
});

executionRouter.get('/:id/', executeFunction);

export default executionRouter;
