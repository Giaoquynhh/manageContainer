type CacheEntry<T> = { value: T; expireAt: number };

export class InMemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  constructor(private defaultTtlMs: number = 60_000){}
  get<T>(key: string): T | null {
    const it = this.store.get(key);
    if (!it) return null;
    if (Date.now() > it.expireAt) { this.store.delete(key); return null; }
    return it.value as T;
  }
  set<T>(key: string, value: T, ttlMs?: number){
    this.store.set(key, { value, expireAt: Date.now() + (ttlMs ?? this.defaultTtlMs) });
  }
}

export const cache = new InMemoryCache(120_000);


