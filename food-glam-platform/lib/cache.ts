type CacheEntry = { value: any; expiresAt: number | null };

const store = new Map<string, CacheEntry>();

export function cacheSet(key: string, value: any, ttlSeconds?: number) {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  store.set(key, { value, expiresAt });
}

export function cacheGet(key: string) {
  const e = store.get(key);
  if (!e) return null;
  if (e.expiresAt && Date.now() > e.expiresAt) {
    store.delete(key);
    return null;
  }
  return e.value;
}

export function cacheDelete(key: string) {
  store.delete(key);
}

export function cacheClear() {
  store.clear();
}
