import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function main() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not configured in .env');
    return;
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const AILog = mongoose.model('AILog', new mongoose.Schema({}, { strict: false }));
  
  const failedLogs = await AILog.find({ status: 'Failed' })
    .sort({ createdAt: -1 })
    .limit(10);

  console.log(`Found ${failedLogs.length} failed logs:`);
  failedLogs.forEach((log, index) => {
    console.log(`\n--- Failed Log #${index + 1} ---`);
    console.log(`Timestamp: ${log.createdAt}`);
    console.log(`Provider: ${log.provider}`);
    console.log(`Model: ${log.model}`);
    console.log(`Module: ${log.module}`);
    console.log(`Error Message: ${log.errorMessage}`);
    console.log(`Prompt Preview: ${log.prompt ? log.prompt.slice(0, 150) + '...' : 'None'}`);
  });

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
