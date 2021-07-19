import {Router} from 'express';

import createInstance from '../endpoints/createInstance';
import listInstances from '../endpoints/listInstances';
import updateInstance from '../endpoints/updateInstance';
import deleteInstance from '../endpoints/deleteInstance';
import createOrUpdateVolume from '../endpoints/createUpdateVolume';
import getVolume from '../endpoints/getVolume';

import password from '../middleware/password';
import {celebrate, Joi, Segments} from 'celebrate';
import listVolumes from '../endpoints/listVolumes';

const adminRouter = Router();
adminRouter.use(password);

adminRouter.use('/listInstances', listInstances);

adminRouter.post('/createInstance', celebrate({
  [Segments.BODY]: {
    name: Joi.string().required(),
  }
}), createInstance);

adminRouter.post('/createOrUpdateVolume', celebrate({
  [Segments.BODY]: {
    name: Joi.string().required(),
    id: Joi.string(),
    files: Joi.object().required()
  }}), createOrUpdateVolume);

adminRouter.post('/updateInstance', celebrate({
  [Segments.BODY]: {
    id: Joi.string().required(),
    name: Joi.string().required(),
  }}), updateInstance);

adminRouter.get('/getVolume', celebrate({
  [Segments.QUERY]: {
    id: Joi.string().required(),
  }}), getVolume);

adminRouter.post('/deleteInstance', celebrate({
  [Segments.BODY]: {
    id: Joi.string().required(),
  }}), deleteInstance);

adminRouter.get('/listVolumes', listVolumes);

export default adminRouter;
