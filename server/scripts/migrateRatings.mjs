import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/antriin';

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const queues = db.collection('queues');
  const ratings = db.collection('ratings');

  const existing = await queues.find({ rating: { $ne: null, $exists: true } }).toArray();
  console.log(`Found ${existing.length} queues with ratings`);

  let created = 0;
  let skipped = 0;

  for (const q of existing) {
    const already = await ratings.findOne({ queueId: q._id });
    if (already) {
      skipped++;
      continue;
    }

    await ratings.insertOne({
      merchantId: q.merchantId,
      queueId: q._id,
      customerToken: q.customerToken || '',
      customerPhone: q.customerPhone || '',
      customerName: q.customerName,
      queueNumber: q.queueNumber,
      rating: q.rating,
      comment: q.ratingComment || '',
      services: q.services || [],
      createdAt: q.createdAt || new Date(),
      updatedAt: new Date(),
    });
    created++;
  }

  console.log(`Created ${created} rating documents, skipped ${skipped} (already migrated)`);
  await mongoose.disconnect();
  console.log('Done');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});