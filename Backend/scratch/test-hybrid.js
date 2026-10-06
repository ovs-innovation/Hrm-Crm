import 'dotenv/config';
import mongoose from 'mongoose';
import { runAgentOrchestrator } from '../services/aiAgents.service.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hrm-crm';

async function testQuery(query) {
  console.log(`\n==================================================`);
  console.log(`Testing query: "${query}"`);
  console.log(`==================================================`);
  
  const start = Date.now();
  const res = await runAgentOrchestrator(
    query,
    'Admin',
    new mongoose.Types.ObjectId("660d3d5d7870958197e8acb9"),
    { userEmail: 'ceo@novatech.demo', module: 'Dashboard' },
    [],
    []
  );
  
  console.log(`Latency:      ${Date.now() - start}ms`);
  console.log(`Classified:   ${res.reasoning}`);
  console.log(`AI Response:  ${res.summary}`);
  console.log(`Actions:      ${JSON.stringify(res.actions)}`);
}

async function runAll() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await testQuery("Hello");
    await testQuery("What is AI?");
    await testQuery("Show employees");

    await mongoose.disconnect();
  } catch (error) {
    console.error('Test run failed:', error);
  }
}

runAll();
