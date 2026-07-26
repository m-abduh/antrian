import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  login,
  register,
  googleAuth,
  googleEmailLogin,
  logout,
  getMe,
  getMerchant,
  updateMerchant,
  setupMerchant,
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
router.post('/register', register);
router.post('/auth/google', googleAuth);
router.post('/auth/google-email', googleEmailLogin);
router.post('/logout', logout);

router.use(authenticate);

router.get('/me', getMe);
router.get('/merchant', getMerchant);
router.put('/merchant', updateMerchant);
router.post('/merchant/setup', setupMerchant);
router.get('/queues', getQueues);
router.patch('/queues/:id/status', updateQueueStatus);
router.patch('/queues/:id/start', startServing);

router.get('/stats', getStats);

router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

export default router;
