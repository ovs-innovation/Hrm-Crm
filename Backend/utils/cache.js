/**
 * Cache layer — Redis when REDIS_URL is set, otherwise in-process Map with TTL.
 * Fail-open: cache errors never break request path.
 */

let redis = null;
const memory = new Map();

async function getRedis() {
  if (redis !== null) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    redis = false;
    return null;
  }
  try {
    const { default: Redis } = await import('ioredis');
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    await redis.connect();
    console.log('✅ Redis cache connected');
    return redis;
  } catch (err) {
    console.warn('[cache] Redis unavailable, using memory:', err.message);
    redis = false;
    return null;
  }
}

function memGet(key) {
  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt && hit.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

function memSet(key, value, ttlSec) {
  memory.set(key, {
    value,
    expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : null,
  });
  // crude bound
  if (memory.size > 5000) {
    const first = memory.keys().next().value;
    memory.delete(first);
  }
}

export async function cacheGet(key) {
  try {
    const r = await getRedis();
    if (r) {
      const raw = await r.get(key);
      return raw ? JSON.parse(raw) : null;
    }
    return memGet(key);
  } catch {
    return memGet(key);
  }
}

export async function cacheSet(key, value, ttlSec = 60) {
  try {
    const r = await getRedis();
    if (r) {
      await r.set(key, JSON.stringify(value), 'EX', ttlSec);
      return;
    }
    memSet(key, value, ttlSec);
  } catch {
    memSet(key, value, ttlSec);
  }
}

export async function cacheDel(key) {
  try {
    const r = await getRedis();
    if (r) await r.del(key);
  } catch { /* ignore */ }
  memory.delete(key);
}

export async function cacheGetOrSet(key, ttlSec, producer) {
  const existing = await cacheGet(key);
  if (existing != null) return { value: existing, hit: true };
  const value = await producer();
  await cacheSet(key, value, ttlSec);
  return { value, hit: false };
}

export default { cacheGet, cacheSet, cacheDel, cacheGetOrSet };
