// In-memory cache with TTL support

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private writesSinceSweep = 0;
  private readonly sweepInterval: number;

  constructor(sweepEveryNWrites: number = 50) {
    this.sweepInterval = sweepEveryNWrites;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [k, e] of this.store) {
      if (e.expiresAt <= now) this.store.delete(k);
    }
  }

  private maybeSweep(): void {
    this.writesSinceSweep++;
    if (this.writesSinceSweep >= this.sweepInterval) {
      this.writesSinceSweep = 0;
      this.sweep();
    }
  }

  private isAlive(entry: CacheEntry<T>): boolean {
    return entry.expiresAt > Date.now();
  }

  set(key: string, value: T, ttl: number = 60_000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      accessCount: 0,
    });
    this.maybeSweep();
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (!this.isAlive(entry)) {
      this.store.delete(key);
      return undefined;
    }

    entry.accessCount++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (!this.isAlive(entry)) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  get size(): number {
    this.sweep();
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
    this.writesSinceSweep = 0;
  }

  getAll(): Map<string, T> {
    this.sweep();
    const result = new Map<string, T>();
    for (const [key, entry] of this.store) {
      result.set(key, entry.value);
    }
    return result;
  }

  getStats(): { total: number; active: number; expired: number } {
    const now = Date.now();
    let active = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store) {
      if (entry.expiresAt > now) {
        active++;
      } else {
        keysToDelete.push(key);
      }
    }

    for (const k of keysToDelete) this.store.delete(k);

    return { total: active, active, expired: 0 };
  }
}
