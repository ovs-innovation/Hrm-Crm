import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const DEMO_PASSWORD = 'Vastora@123';

const ROLE_ACCOUNTS = [
  { name: 'Vastora Founder', email: 'founder@vastora.tech', role: 'Founder' },
  { name: 'Vastora Admin', email: 'admin@vastora.tech', role: 'Admin' },
  { name: 'Vastora Manager', email: 'manager@vastora.tech', role: 'Manager' },
  { name: 'Vastora HR', email: 'hr@vastora.tech', role: 'HR' },
  { name: 'Vastora Sales', email: 'sales@vastora.tech', role: 'Sales' },
];

const resetAndSeedRoles = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set in Backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const dbName = mongoose.connection.name;

  console.log(`\n⚠️  Dropping database: ${dbName}`);
  await mongoose.connection.dropDatabase();
  console.log('✓ Database cleared (all collections removed)\n');

  const created = [];
  for (const account of ROLE_ACCOUNTS) {
    const admin = await Admin.create({
      name: account.name,
      email: account.email,
      password: DEMO_PASSWORD,
      role: account.role,
    });
    created.push(admin);
    console.log(`✓ ${account.role.padEnd(8)} → ${account.email}`);
  }

  console.log('\n--- Login credentials (Admin portal: http://localhost:5174/login) ---');
  console.log(`Password (all accounts): ${DEMO_PASSWORD}\n`);
  ROLE_ACCOUNTS.forEach((a) => {
    console.log(`  ${a.role.padEnd(8)}  ${a.email}`);
  });
  console.log('');

  await mongoose.disconnect();
};

resetAndSeedRoles().catch((error) => {
  console.error(error);
  process.exit(1);
});
