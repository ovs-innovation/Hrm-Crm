import Memory from '../models/Memory.js';
import Tenant from '../models/Tenant.js';
import * as vectorService from './vector.service.js';
import { callLLM } from './llm.service.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

// Local process cache (L1) — Redis is L2 via utils/cache.js
const cache = {};

export function getCache(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    delete cache[key];
    return null;
  }
  return entry.value;
}

export function setCache(key, value, ttlMs = 300000) {
  cache[key] = {
    value,
    expiry: Date.now() + ttlMs
  };
  // best-effort L2
  cacheSet(key, value, Math.max(1, Math.floor(ttlMs / 1000))).catch(() => {});
}

export async function getCacheAsync(key) {
  const local = getCache(key);
  if (local != null) return local;
  const remote = await cacheGet(key);
  if (remote != null) {
    setCache(key, remote, 60_000);
    return remote;
  }
  return null;
}

/**
 * Rank Memories dynamically by computing similarity vectors on-the-fly
 */
export async function retrieveRankedMemories(queryText, tenantId, userId, activeModule, metrics) {
  const start = Date.now();
  const cacheKey = `memories_${tenantId}_${userId}_${activeModule}`;
  let memories = await getCacheAsync(cacheKey);

  if (!memories) {
    metrics.cacheMiss++;
    memories = await Memory.find({
      tenantId,
      $or: [
        { scope: 'Global' },
        { scope: activeModule },
        { userId }
      ]
    });
    setCache(cacheKey, memories, 60000); // Cache for 60 seconds
  } else {
    metrics.cacheHit++;
  }

  if (memories.length === 0) return [];

  try {
    const queryVector = await vectorService.generateEmbedding(queryText);
    const ranked = await Promise.all(memories.map(async (m) => {
      // Calculate similarity vector
      const memVector = await vectorService.generateEmbedding(m.content);
      const score = vectorService.cosineSimilarity(queryVector, memVector);
      return { memory: m, score };
    }));

    ranked.sort((a, b) => b.score - a.score);
    const topMemories = ranked.slice(0, 5).map(r => r.memory);
    metrics.memoryCount = topMemories.length;
    return topMemories;
  } catch (err) {
    console.warn('[Memory similarity fallback]', err.message);
    const topMemories = memories.slice(0, 5);
    metrics.memoryCount = topMemories.length;
    return topMemories;
  }
}

/**
 * Filter policies dynamically by active module scope
 */
export async function retrieveScopedPolicies(activeModule, tenantId, metrics) {
  const cacheKey = `policies_${tenantId}_${activeModule}`;
  let policies = getCache(cacheKey);

  if (!policies) {
    metrics.cacheMiss++;
    // Get rules matching module scope
    policies = await Memory.find({
      tenantId,
      scope: activeModule
    });
    setCache(cacheKey, policies, 120000); // Cache for 2 mins
  } else {
    metrics.cacheHit++;
  }

  metrics.policyCount = policies.length;
  return policies.slice(0, 5);
}

/**
 * Compress and summarize long historical conversation logs
 */
export async function compressConversationHistory(prevLogs, metrics) {
  if (prevLogs.length <= 3) return prevLogs;

  const logsToCompress = prevLogs.slice(3); // old history
  const recentLogs = prevLogs.slice(0, 3); // keep last 3 active

  const promptText = logsToCompress
    .map(l => `User: "${l.prompt}"\nAI: "${l.response?.substring(0, 100)}..."`)
    .join('\n');

  const compressPrompt = `
Compress the following old conversation logs into a single concise paragraph summary of context and parameters discussed:
${promptText}
`;

  try {
    const summary = await callLLM(compressPrompt, { provider: 'groq', module: 'Compressor' });
    return [
      { prompt: "[Historical Conversation Summary]", response: summary },
      ...recentLogs
    ];
  } catch (err) {
    console.error('[History Compression Error]', err.message);
    return prevLogs;
  }
}

/**
 * Load tenant config with caching
 */
export async function loadCachedTenant(tenantId, metrics) {
  const cacheKey = `tenant_${tenantId}`;
  let tenant = getCache(cacheKey);

  if (!tenant) {
    metrics.cacheMiss++;
    tenant = await Tenant.findById(tenantId);
    if (tenant) setCache(cacheKey, tenant, 300000); // 5 mins Cache
  } else {
    metrics.cacheHit++;
  }
  return tenant;
}
