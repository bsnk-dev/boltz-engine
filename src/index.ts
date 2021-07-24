import cluster from 'cluster';

// @ts-ignore
if (!cluster.isPrimary) cluster.isPrimary = cluster.isMaster;

if (cluster.isPrimary) {
  console.log('Started Boltz Engine.');
} else if (cluster.isWorker) {
  console.log('Started Boltz Worker.');
}

import './loaders';
import './api';

import VMWorker from './services/vmWorker';

if (cluster.isWorker) {
  const worker = new VMWorker();
}