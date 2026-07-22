import { Router } from 'express';
import { getMerchant, getServices, createQueue, getLiveQueue } from '../controllers/merchantController.js';

const router = Router();

router.get('/:slug', getMerchant);
router.get('/:slug/services', getServices);
router.post('/:slug/queue', createQueue);
router.get('/:slug/queue/live', getLiveQueue);

export default router;
