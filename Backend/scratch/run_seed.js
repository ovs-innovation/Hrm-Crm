import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ensureNovaTechDemo } from '../services/demoWorkspace.service.js';

dotenv.config();

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected.');

    console.log('Running high-fidelity workspace seeding...');
    const result = await ensureNovaTechDemo({ force: true });
    console.log('Seeding result:', result);

    await mongoose.disconnect();
    console.log('Database disconnected. Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

run();
