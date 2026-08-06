import Redis from 'ioredis';

// Instantiate Redis with fallback in-memory cache to ensure server boots offline
let redisClient = null;
const memoryCache = new Map();

let hasWarned = false;
try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    reconnectOnError: () => false,
    retryStrategy: (times) => {
      // Reconnect strategy: try every 30 seconds instead of flooding
      if (times > 5 && !hasWarned) {
        hasWarned = true;
      }
      return 30000;
    }
  });
  redisClient.on('error', (err) => {
    if (!hasWarned) {
      console.warn('[Redis] Connection offline, falling back to in-memory store:', err.message);
      hasWarned = true;
    }
  });
} catch (e) {
  console.warn('[Redis] Initialization error, using in-memory fallback:', e.message);
}

export const getCache = async (key) => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    console.error('[Redis Cache Get Error]', err.message);
  }
  return memoryCache.get(key) || null;
};

export const setCache = async (key, val, ttlSeconds = 300) => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.set(key, JSON.stringify(val), 'EX', ttlSeconds);
      return true;
    }
  } catch (err) {
    console.error('[Redis Cache Set Error]', err.message);
  }
  memoryCache.set(key, val);
  setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
  return true;
};

export const deleteCache = async (key) => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.del(key);
      return true;
    }
  } catch (err) {
    console.error('[Redis Cache Delete Error]', err.message);
  }
  memoryCache.delete(key);
  return true;
};

export { redisClient };
