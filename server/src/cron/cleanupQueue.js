import Queue from '../models/Queue.js';
import logger from '../config/logger.js';

export async function cleanupExpiredQueues() {
  const result = await Queue.updateMany(
    {
      status: 'waiting',
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    { $set: { status: 'skipped' } }
  );

  if (result.modifiedCount > 0) {
    logger.info(`[Cron] Cleaned up ${result.modifiedCount} stale waiting queues`);
  }
}
