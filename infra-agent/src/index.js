import http from 'http';
import crypto from 'crypto';
import { collectAll } from './collectors.js';

function env(name, fallback = '') {
  return process.env[name] ?? fallback;
}

function tokensMatch(provided, expected) {
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

const TOKEN = env('AGENT_TOKEN');
const PORT = Number(env('PORT', '9100'));
const HOST = env('HOST', '127.0.0.1');
const VASTORA_API_URL = env('VASTORA_API_URL').replace(/\/$/, '');
const VASTORA_SERVER_ID = env('VASTORA_SERVER_ID');
const PUSH_INTERVAL_SEC = Number(env('PUSH_INTERVAL_SEC', '60'));

if (!TOKEN) {
  console.error('[infra-agent] AGENT_TOKEN is required');
  process.exit(1);
}

function unauthorized(res) {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Unauthorized' }));
}

function authOk(req) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const xToken = req.headers['x-agent-token'] || req.headers['x-infra-agent-token'];
  const provided = String(bearer || xToken || '');
  if (!provided) return false;
  return tokensMatch(provided, TOKEN);
}

async function handleMetrics(req, res) {
  if (!authOk(req)) return unauthorized(res);
  try {
    const metrics = await collectAll();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'collect failed' }));
  }
}

async function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'GET' && (path === '/health' || path === '/')) {
    return handleHealth(req, res);
  }
  if (req.method === 'GET' && (path === '/metrics' || path === '/v1/metrics')) {
    return handleMetrics(req, res);
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

async function pushOnce() {
  if (!VASTORA_API_URL || !VASTORA_SERVER_ID) return;
  const metrics = await collectAll();
  const url = `${VASTORA_API_URL}/api/infrastructure/agent/ingest`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'X-Agent-Token': TOKEN,
      'X-Infra-Agent-Token': TOKEN,
      'X-Server-Id': VASTORA_SERVER_ID,
    },
    body: JSON.stringify({
      serverId: VASTORA_SERVER_ID,
      metrics,
      collectedAt: metrics.collectedAt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[infra-agent] push failed ${res.status}: ${text.slice(0, 200)}`);
  } else {
    console.log(`[infra-agent] pushed metrics for ${VASTORA_SERVER_ID}`);
  }
}

const once = process.argv.includes('--once');

if (once) {
  const metrics = await collectAll();
  console.log(JSON.stringify(metrics, null, 2));
  if (VASTORA_API_URL && VASTORA_SERVER_ID) {
    await pushOnce();
  }
  process.exit(0);
}

server.listen(PORT, HOST, () => {
  console.log(`[infra-agent] listening on http://${HOST}:${PORT}`);
  console.log('[infra-agent] GET /metrics (Authorization: Bearer or X-Agent-Token)');
});

if (VASTORA_API_URL && VASTORA_SERVER_ID && PUSH_INTERVAL_SEC > 0) {
  pushOnce().catch((e) => console.error('[infra-agent] initial push', e.message));
  setInterval(() => {
    pushOnce().catch((e) => console.error('[infra-agent] push', e.message));
  }, PUSH_INTERVAL_SEC * 1000);
}
