import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

async function checkGemini() {
  if (!geminiApiKey) return 'GEMINI_API_KEY not set';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
    if (res.ok) {
      const data = await res.json();
      return `Success: Found ${data.models?.length} models`;
    }
    return `Failed: HTTP ${res.status} - ${await res.text()}`;
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

async function checkGroq() {
  if (!groqApiKey) return 'GROQ_API_KEY not set';
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${groqApiKey}` }
    });
    if (res.ok) {
      return `Success: reachable`;
    }
    return `Failed: HTTP ${res.status} - ${await res.text()}`;
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

async function checkOpenRouter() {
  if (!openrouterApiKey) return 'OPENROUTER_API_KEY not set';
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${openrouterApiKey}` }
    });
    if (res.ok) {
      return `Success: reachable`;
    }
    return `Failed: HTTP ${res.status} - ${await res.text()}`;
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

async function main() {
  console.log('Testing API configurations...');
  const geminiResult = await checkGemini();
  const groqResult = await checkGroq();
  const openRouterResult = await checkOpenRouter();

  console.log('Gemini Status:', geminiResult);
  console.log('Groq Status:', groqResult);
  console.log('OpenRouter Status:', openRouterResult);
}

main();
