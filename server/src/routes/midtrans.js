import { Router } from 'express';
import { handleNotification } from '../controllers/midtransController.js';

const router = Router();

router.post('/notification', handleNotification);

export default router;
