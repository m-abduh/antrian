import Queue from '../models/Queue.js';
import logger from '../config/logger.js';

export async function cleanupExpiredQueues() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const result = await Queue.updateMany(
    {
      status: 'pending_payment',
      paymentStatus: 'pending',
      createdAt: { $lt: thirtyMinutesAgo },
    },
    {
      $set: { paymentStatus: 'expired', status: 'skipped' },
    }
  );

  if (result.modifiedCount > 0) {
    logger.info(`[Cron] Cleaned up ${result.modifiedCount} expired queues`);
  }
}
