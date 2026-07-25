import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getMerchant, getServices, createQueue, getLiveQueue, submitRating, subscribePush, unsubscribePush } from '../controllers/merchantController.js';

const router = Router();

const queueRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip + '-' + (req.body?.phone || ''),
  message: { error: 'Terlalu banyak membuat antrian. Silakan coba lagi nanti.' },
});

router.get('/:slug', getMerchant);
router.get('/:slug/services', getServices);
router.post('/:slug/queue', queueRateLimiter, createQueue);
router.get('/:slug/queue/live', getLiveQueue);
router.post('/:slug/queue/:id/rating', submitRating);
router.post('/:slug/subscribe', subscribePush);
router.post('/:slug/unsubscribe', unsubscribePush);

export default router;