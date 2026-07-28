import Counter from '../models/Counter.js';

export async function generateQueueNumber(merchantId) {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const today = wib.toISOString().slice(0, 10);

  const counter = await Counter.findOneAndUpdate(
    { merchantId, date: today },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const prefix = 'A';
  return `${prefix}${String(counter.seq).padStart(3, '0')}`;
}

const AVG_SERVICE_DURATION_MINUTES = 10;

export function calculateEstimatedTime(queuesAhead) {
  return queuesAhead * AVG_SERVICE_DURATION_MINUTES;
}
