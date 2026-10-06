import dotenv from 'dotenv';
import { callLLM } from '../services/llm.service.js';

dotenv.config();

async function main() {
  console.log('Testing callLLM with JSON mode...');
  try {
    const result = await callLLM('Generate a small JSON object with keys "success" (boolean) and "message" (string).', { jsonMode: true });
    console.log('Test Result:', result);
    if (result && typeof result === 'object' && 'success' in result) {
      console.log('✅ AI response parsed and returned successfully!');
    } else {
      console.log('❌ Unexpected result format.');
    }
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
  }
}

main().catch(console.error);
