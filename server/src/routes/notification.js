import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { subscribe, unsubscribe, triggerNotification } from '../controllers/notificationController.js';

const router = Router();

router.use(authenticate);

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/trigger', triggerNotification);

export default router;
