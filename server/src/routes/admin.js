import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  login,
  register,
  googleAuth,
  googleTokenLogin,

  logout,
  getMe,
  getMerchant,
  updateMerchant,
  setupMerchant,
  getQueues,
  updateQueueStatus,
  startServing,
  togglePayment,
  getCustomers,
  getRatings,
  getStats,
  getFinance,
  getServices,
  createService,
  updateService,
  deleteService,
} from '../controllers/adminController.js';
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from '../controllers/groupController.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/auth/google', googleAuth);
router.post('/auth/google-token', googleTokenLogin);

router.post('/logout', logout);

router.use(authenticate);

router.get('/me', getMe);
router.get('/merchant', getMerchant);
router.put('/merchant', updateMerchant);
router.post('/merchant/setup', setupMerchant);
router.get('/queues', getQueues);
router.patch('/queues/:id/status', updateQueueStatus);
router.patch('/queues/:id/start', startServing);
router.patch('/queues/:id/payment', togglePayment);

router.get('/stats', getStats);
router.get('/finance', getFinance);
router.get('/customers', getCustomers);
router.get('/ratings', getRatings);

router.get('/services', getServices);
router.post('/services', createService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.put('/groups/:id', updateGroup);
router.delete('/groups/:id', deleteGroup);

export default router;
