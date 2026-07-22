import Counter from '../models/Counter.js';

export async function generateQueueNumber(merchantId) {
  const today = new Date().toISOString().slice(0, 10);

  const counter = await Counter.findOneAndUpdate(
    { merchantId, date: today },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const prefix = 'A';
  return `${prefix}${String(counter.seq).padStart(3, '0')}`;
}

export function calculateEstimatedTime(queuesAhead, serviceDuration) {
  return queuesAhead * serviceDuration;
}
