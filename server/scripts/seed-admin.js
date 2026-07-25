import mongoose from 'mongoose';
import readline from 'readline';
import Merchant from '../src/models/Merchant.js';
import Admin from '../src/models/Admin.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/antriin';
  await mongoose.connect(uri);
  console.log(`Connected to ${uri}\n`);

  console.log('=== Create First Merchant & Admin ===\n');

  const merchantName = await ask('Merchant name: ');
  const slug = (await ask('Slug (e.g. barberku): ')).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const address = await ask('Address (optional): ');
  const merchantPhone = await ask('Phone (optional): ');

  const adminName = await ask('Admin name: ');
  const adminEmail = (await ask('Admin email: ')).toLowerCase().trim();
  const adminPassword = await ask('Admin password (min 6 chars): ');

  if (!merchantName || !slug || !adminName || !adminEmail || !adminPassword) {
    console.log('\nError: All required fields must be filled.');
    process.exit(1);
  }

  const merchant = await Merchant.create({
    name: merchantName,
    slug,
    address: address || '',
    phone: merchantPhone || '',
    isActive: true,
  });

  await Admin.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    merchantId: merchant._id,
    role: 'admin',
  });

  console.log(`\n✓ Merchant "${merchantName}" (${slug}) created`);
  console.log(`✓ Admin "${adminName}" (${adminEmail}) created`);
  console.log(`\nLogin at http://localhost:3001 with the admin credentials above.`);

  await mongoose.disconnect();
  rl.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
