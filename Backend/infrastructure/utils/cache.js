/** Tiny in-memory TTL cache for dashboard / repeated reads. */

const store = new Map();

export const cacheGet = (key) => {
  const row = store.get(key);
  if (!row) return undefined;
  if (Date.now() > row.expires) {
    store.delete(key);
    return undefined;
  }
  return row.value;
};

export const cacheSet = (key, value, ttlMs = 15000) => {
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
};

export const cacheDel = (prefixOrKey) => {
  if (!prefixOrKey) return;
  if (store.has(prefixOrKey)) {
    store.delete(prefixOrKey);
    return;
  }
  for (const key of store.keys()) {
    if (String(key).startsWith(prefixOrKey)) store.delete(key);
  }
};
