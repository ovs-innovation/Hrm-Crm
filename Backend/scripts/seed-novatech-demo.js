import 'dotenv/config';
import mongoose from 'mongoose';
import { ensureNovaTechDemo, DEMO_META } from '../services/demoWorkspace.service.js';

const force = process.argv.includes('--force');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI required');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`\n🌱 Seeding ${DEMO_META.companyName} (force=${force})...\n`);
  const result = await ensureNovaTechDemo({ force });
  console.log(JSON.stringify(result, null, 2));
  console.log('\n--- Demo login ---');
  console.log(`Email:    ${DEMO_META.adminEmail}`);
  console.log(`Password: ${DEMO_META.password}`);
  console.log(`Also:     ${DEMO_META.hrEmail} / ${DEMO_META.salesEmail}`);
  console.log('');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
