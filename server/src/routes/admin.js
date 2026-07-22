import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  login,
  getQueues,
  updateQueueStatus,
  startServing,
  getStats,
  getServices,
  createService,
  updateService,
  deleteService,
} from '../controllers/adminController.js';

const router = Router();

router.post('/login', login);

router.use(authenticate);

router.get('/queues', getQueues);
router.patch('/queues/:id/status', updateQueueStatus);
router.patch('/queues/:id/start', startServing);

router.get('/stats', getStats);

router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

export default router;
