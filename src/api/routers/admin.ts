import express, {Router} from 'express';

import createInstance from '../endpoints/createInstance';
import listInstances from '../endpoints/listInstances';
import updateInstance from '../endpoints/updateInstance';
import deleteInstance from '../endpoints/deleteInstance';
import createOrUpdateVolume from '../endpoints/createUpdateVolume';
import getVolume from '../endpoints/getVolume';
import getLogs from '../endpoints/getLogs';

import password from '../middleware/password';
import {celebrate, Joi, Segments} from 'celebrate';
import listVolumes from '../endpoints/listVolumes';
import deleteVolume from '../endpoints/deleteVolume';
import getServerLoad from '../endpoints/getServerLoad';

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
    files: Joi.string(),
  }}), createOrUpdateVolume);

adminRouter.post('/updateInstance', celebrate({
  [Segments.BODY]: {
    id: Joi.string().required(),
    instance: Joi.object({
      name: Joi.string(),
      volumeID: Joi.string(),
    }).required(),
  }}), updateInstance);

adminRouter.get('/getVolume', celebrate({
  [Segments.QUERY]: {
    id: Joi.string().required(),
  }}), getVolume);

adminRouter.post('/deleteInstance', celebrate({
  [Segments.BODY]: {
    id: Joi.string().required(),
  }}), deleteInstance);

adminRouter.post('/deleteVolume', celebrate({
  [Segments.BODY]: {
    id: Joi.string().required(),
  }}), deleteVolume);

adminRouter.get('/listVolumes', listVolumes);

adminRouter.get('/getLogs', celebrate({
  [Segments.QUERY]: {
    id: Joi.string().required(),
  }}), getLogs);

adminRouter.get('/getServerLoad', getServerLoad);

export default adminRouter;
