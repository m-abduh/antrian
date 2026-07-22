import Queue from '../models/Queue.js';

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
    console.log(`[Cron] Cleaned up ${result.modifiedCount} expired queues`);
  }
}
