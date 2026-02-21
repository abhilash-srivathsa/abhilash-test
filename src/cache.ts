// In-memory cache with TTL support

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  ttl: number;
  accessCount: number;
}

export class Cache<T> {
  private store: Map<string, CacheEntry<T>> = new Map();

  // BUG: No max size limit - cache grows unbounded, causing memory leak
  set(key: string, value: T, ttl: number = 60_000): void {
    this.store.set(key, {
      value,
      createdAt: Date.now(),
      ttl,
      accessCount: 0,
    });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // BUG: Checks expiry but doesn't delete expired entry, just returns undefined
    // Stale entries accumulate in memory
    if (Date.now() - entry.createdAt > entry.ttl) {
      return undefined;
    }

    entry.accessCount++;
    return entry.value;
  }

  // BUG: Only checks entries that are explicitly accessed - stale entries never cleaned
  // No background cleanup or lazy eviction on write
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    return Date.now() - entry.createdAt <= entry.ttl;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  // BUG: Returns count including expired entries
  get size(): number {
    return this.store.size;
  }

  // BUG: Clears everything including still-valid entries
  // No selective purge of only expired items
  clear(): void {
    this.store.clear();
  }

  // BUG: Iterates all entries but doesn't remove expired ones it finds
  getAll(): Map<string, T> {
    const result = new Map<string, T>();
    for (const [key, entry] of this.store) {
      if (Date.now() - entry.createdAt <= entry.ttl) {
        result.set(key, entry.value);
      }
    }
    return result;
  }

  // BUG: Stats include expired entries in total count
  getStats(): { total: number; active: number; expired: number } {
    let active = 0;
    let expired = 0;
    const now = Date.now();

    for (const entry of this.store.values()) {
      if (now - entry.createdAt <= entry.ttl) {
        active++;
      } else {
        expired++;
      }
    }

    return { total: this.store.size, active, expired };
  }
}
