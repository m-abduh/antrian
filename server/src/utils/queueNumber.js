import Queue from '../models/Queue.js';

export async function generateQueueNumber(merchantId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastQueue = await Queue.findOne({
    merchantId,
    createdAt: { $gte: today, $lt: tomorrow },
  }).sort({ queueNumber: -1 });

  const prefix = 'A';
  let nextNumber = 1;

  if (lastQueue && lastQueue.queueNumber) {
    const lastNum = parseInt(lastQueue.queueNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

export function calculateEstimatedTime(queuesAhead, serviceDuration) {
  return queuesAhead * serviceDuration;
}
