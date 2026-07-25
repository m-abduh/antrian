import Counter from '../models/Counter.js';

export async function generateQueueNumber(merchantId) {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const today = wib.toISOString().slice(0, 10);

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
