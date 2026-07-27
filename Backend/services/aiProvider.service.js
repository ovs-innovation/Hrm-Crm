import { GoogleGenerativeAI } from '@google/generative-ai';
import AILog from '../models/AILog.js';
import { contextStorage } from '../middlewares/contextMiddleware.js';

// ─── Provider initialization ──────────────────────────────────────────────────
const defaultProvider = process.env.AI_PROVIDER || 'groq';
const geminiApiKey = process.env.GEMINI_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;
const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

let genAI = null;
if (geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(geminiApiKey);
    console.log('✅ Gemini AI client initialized.');
  } catch (err) {
    console.error('❌ Failed to initialize Gemini AI client:', err.message);
  }
}

// ─── Exponential Backoff Retry ────────────────────────────────────────────────
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err.message || '';
      const isRetryable = msg.includes('429') || msg.includes('503') ||
        msg.includes('Too Many Requests') || msg.includes('Service Unavailable');

      if (!isRetryable || i === retries - 1) throw err;
      console.warn(`[AI Provider] Retry ${i + 1}/${retries} after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

// ─── OpenAI-compatible fetch (Groq, OpenRouter, Ollama share this format) ─────
async function openAiCompatibleFetch(baseUrl, apiKey, modelName, prompt, options, correlationId) {
  const timeoutMs = Number(process.env.AI_TIMEOUT) || 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (options.signal) options.signal.addEventListener('abort', () => controller.abort());

  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
    ...(baseUrl.includes('openrouter') ? {
      'HTTP-Referer': 'https://vastora.com',
      'X-Title': 'Vastora CRM',
    } : {}),
  };

  const payload = {
    model: modelName,
    messages: [{ role: 'user', content: prompt }],
    temperature: Number(process.env.AI_TEMPERATURE) || 0.2,
    max_tokens: Number(process.env.AI_MAX_TOKENS) || 4096,
    ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  try {
    const res = await retryWithBackoff(() =>
      fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    );
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `HTTP ${res.status} from ${baseUrl}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const inputTokens = data.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4);
    const outputTokens = data.usage?.completion_tokens ?? Math.ceil(text.length / 4);

    return { text, inputTokens, outputTokens };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Core: generateText ───────────────────────────────────────────────────────
export async function generateText(prompt, options = {}) {
  const start = Date.now();
  const activeProvider = options.provider || defaultProvider;

  const store = contextStorage.getStore();
  const activeTenantId = options.tenantId || store?.tenantId;
  const activeUser = options.user || store?.user || 'System';
  const correlationId = options.correlationId || `corr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const module_ = options.module || 'General';

  const logEntry = async (providerName, modelName, text, inputTk, outputTk, cost, status, errorMsg) => {
    if (!activeTenantId) return;
    AILog.create({
      prompt, response: text,
      latencyMs: Date.now() - start,
      tokensCount: inputTk + outputTk,
      costUSD: cost,
      module: module_,
      user: activeUser,
      tenantId: activeTenantId,
      provider: providerName,
      model: modelName,
      promptTokens: inputTk,
      completionTokens: outputTk,
      status,
      errorMessage: errorMsg,
      correlationId,
    }).catch(e => console.error('[AILog write error]', e.message));
  };

  const parseJson = (text) => {
    try { return JSON.parse(text); } catch {
      const m = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      if (m) try { return JSON.parse(m[1]); } catch {}
      return null;
    }
  };

  // ── 1. Groq ──
  if (activeProvider === 'groq') {
    if (!groqApiKey) throw new Error('GROQ_API_KEY not set in environment.');
    const modelName = options.model || process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';
    // Groq doesn't support json_object format for all models — strip it
    const groqOptions = { ...options, jsonMode: false };
    // Instead instruct JSON via prompt suffix
    const groqPrompt = options.jsonMode ? `${prompt}\n\nRespond with valid JSON only.` : prompt;
    try {
      const { text, inputTokens, outputTokens } = await openAiCompatibleFetch(
        'https://api.groq.com/openai', groqApiKey, modelName, groqPrompt, groqOptions, correlationId
      );
      const cost = ((inputTokens * 0.05) + (outputTokens * 0.08)) / 1_000_000;
      const parsed = options.jsonMode ? parseJson(text) : null;
      await logEntry('groq', modelName, text, inputTokens, outputTokens, cost, 'Success', null);
      return { text, parsed, tokens: inputTokens + outputTokens, costUSD: cost, latencyMs: Date.now() - start, model: modelName, correlationId };
    } catch (err) {
      const inputTk = Math.ceil(prompt.length / 4);
      await logEntry('groq', modelName, '', inputTk, 0, 0, 'Failed', err.message);
      throw err;
    }
  }

  // ── 2. OpenRouter ──
  if (activeProvider === 'openrouter') {
    if (!openrouterApiKey) throw new Error('OPENROUTER_API_KEY not set in environment.');
    const modelName = options.model || process.env.OPENROUTER_CHAT_MODEL || 'meta-llama/llama-3.3-70b-instruct';
    try {
      const { text, inputTokens, outputTokens } = await openAiCompatibleFetch(
        'https://openrouter.ai/api', openrouterApiKey, modelName, prompt, options, correlationId
      );
      const cost = ((inputTokens + outputTokens) * 0.23) / 1_000_000;
      const parsed = options.jsonMode ? parseJson(text) : null;
      await logEntry('openrouter', modelName, text, inputTokens, outputTokens, cost, 'Success', null);
      return { text, parsed, tokens: inputTokens + outputTokens, costUSD: cost, latencyMs: Date.now() - start, model: modelName, correlationId };
    } catch (err) {
      const inputTk = Math.ceil(prompt.length / 4);
      await logEntry('openrouter', modelName, '', inputTk, 0, 0, 'Failed', err.message);
      throw err;
    }
  }

  // ── 3. Ollama (local) ──
  if (activeProvider === 'ollama') {
    const modelName = options.model || process.env.OLLAMA_CHAT_MODEL || 'llama3.2';
    try {
      const { text, inputTokens, outputTokens } = await openAiCompatibleFetch(
        ollamaBaseUrl, null, modelName, prompt, options, correlationId
      );
      const cost = 0; // free / local
      const parsed = options.jsonMode ? parseJson(text) : null;
      await logEntry('ollama', modelName, text, inputTokens, outputTokens, cost, 'Success', null);
      return { text, parsed, tokens: inputTokens + outputTokens, costUSD: cost, latencyMs: Date.now() - start, model: modelName, correlationId };
    } catch (err) {
      const inputTk = Math.ceil(prompt.length / 4);
      await logEntry('ollama', modelName, '', inputTk, 0, 0, 'Failed', err.message);
      throw err;
    }
  }

  // ── 4. Gemini ──
  if (activeProvider === 'gemini') {
    if (!genAI) throw new Error('GEMINI_API_KEY not set or client failed to initialize.');
    const modelName = options.model || process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash';
    const timeoutMs = Number(process.env.AI_TIMEOUT) || 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (options.signal) options.signal.addEventListener('abort', () => controller.abort());

    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const config = {
        maxOutputTokens: Number(process.env.AI_MAX_TOKENS) || 4096,
        temperature: Number(process.env.AI_TEMPERATURE) || 0.2,
        ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
      };
      const result = await retryWithBackoff(() =>
        model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: config })
      );
      clearTimeout(timer);
      const text = result.response.text();
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(text.length / 4);
      const cost = ((inputTokens * 0.075) + (outputTokens * 0.30)) / 1_000_000;
      const parsed = options.jsonMode ? parseJson(text) : null;
      await logEntry('gemini', modelName, text, inputTokens, outputTokens, cost, 'Success', null);
      return { text, parsed, tokens: inputTokens + outputTokens, costUSD: cost, latencyMs: Date.now() - start, model: modelName, correlationId };
    } catch (err) {
      clearTimeout(timer);
      const inputTk = Math.ceil(prompt.length / 4);
      await logEntry('gemini', modelName, '', inputTk, 0, 0, 'Failed', err.message);
      throw err;
    }
  }

  throw new Error(`AI Provider "${activeProvider}" is not supported. Set AI_PROVIDER in .env to one of: groq, openrouter, ollama, gemini.`);
}

// ─── Embeddings (Gemini only — best quality for RAG) ─────────────────────────
export async function getEmbedding(text) {
  if (!genAI) throw new Error('Gemini is required for embeddings. Set GEMINI_API_KEY in .env.');
  const modelName = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error('[Embedding error]', err.message);
    throw err;
  }
}

// ─── Health Check — All 4 providers, cached 60s ───────────────────────────────
let _healthCache = null;
let _healthCachedAt = 0;

export async function checkHealth() {
  if (_healthCache && (Date.now() - _healthCachedAt < 60_000)) return _healthCache;

  const check = async (label, fn) => {
    try { await fn(); return { configured: true, reachable: true, error: null }; }
    catch (e) { return { configured: true, reachable: false, error: e.message }; }
  };

  const [gemini, groq, openrouter, ollama] = await Promise.all([
    geminiApiKey
      ? check('gemini', () => fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); }))
      : { configured: false, reachable: false, error: 'GEMINI_API_KEY not set' },

    groqApiKey
      ? check('groq', () => fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${groqApiKey}` } }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); }))
      : { configured: false, reachable: false, error: 'GROQ_API_KEY not set' },

    openrouterApiKey
      ? check('openrouter', () => fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${openrouterApiKey}` } }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); }))
      : { configured: false, reachable: false, error: 'OPENROUTER_API_KEY not set' },

    check('ollama', () => fetch(`${ollamaBaseUrl}/api/tags`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })),
  ]);

  _healthCache = {
    activeProvider: defaultProvider,
    activeModel: process.env[`${defaultProvider.toUpperCase()}_CHAT_MODEL`] || '(env not set)',
    providers: { gemini, groq, openrouter, ollama },
    timestamp: new Date().toISOString(),
  };
  _healthCachedAt = Date.now();
  return _healthCache;
}
