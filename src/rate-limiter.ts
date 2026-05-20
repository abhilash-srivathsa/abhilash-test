// Rate limiter for API request throttling

interface RateLimitEntry {
  tokens: number;      // stored as float for continuous refill
  lastRefill: number;
}

function isRateLimitEntry(v: unknown): v is RateLimitEntry {
  return (
    typeof v === 'object' && v !== null &&
    'tokens' in v && typeof (v as any).tokens === 'number' && Number.isFinite((v as any).tokens) &&
    'lastRefill' in v && typeof (v as any).lastRefill === 'number' && Number.isFinite((v as any).lastRefill)
  );
}

export class RateLimiter {
  // Prototype-free object — no collisions with __proto__ / constructor
  private buckets: { [key: string]: RateLimitEntry } = Object.create(null);
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private readonly maxKeys: number;

  constructor(maxTokens: number = 10, refillRate: number = 1, maxKeys: number = 10_000) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.maxKeys = maxKeys;
  }

  // Continuous float-based refill — always updates lastRefill to now
  private refill(key: string): void {
    const entry = this.buckets[key];
    if (!entry) return;

    const now = Date.now();
    const elapsedSec = (now - entry.lastRefill) / 1000;
    entry.tokens = Math.min(this.maxTokens, entry.tokens + elapsedSec * this.refillRate);
    entry.lastRefill = now;
  }

  // Evict oldest entries when over capacity
  private evictIfNeeded(): void {
    const keys = Object.keys(this.buckets);
    if (keys.length <= this.maxKeys) return;

    // Sort by lastRefill ascending — evict stalest
    keys.sort((a, b) => this.buckets[a].lastRefill - this.buckets[b].lastRefill);
    const toRemove = keys.length - this.maxKeys;
    for (let i = 0; i < toRemove; i++) {
      delete this.buckets[keys[i]];
    }
  }

  consume(key: string, tokens: number = 1): boolean {
    if (typeof key !== 'string' || key.length === 0 || key.length > 256) {
      return false;
    }

    if (!(key in this.buckets)) {
      this.evictIfNeeded();
      this.buckets[key] = { tokens: this.maxTokens, lastRefill: Date.now() };
    }

    this.refill(key);

    if (this.buckets[key].tokens >= tokens) {
      this.buckets[key].tokens -= tokens;
      return true;
    }

    return false;
  }

  // Return a copy, not the internal mutable entry
  getStatus(key: string): RateLimitEntry | undefined {
    const entry = this.buckets[key];
    if (!entry) return undefined;
    return { tokens: entry.tokens, lastRefill: entry.lastRefill };
  }

  getActiveCount(): number {
    let count = 0;
    for (const key in this.buckets) {
      if (this.buckets[key].tokens < this.maxTokens) {
        count++;
      }
    }
    return count;
  }

  reset(key: string): void {
    if (key in this.buckets) {
      this.buckets[key].tokens = this.maxTokens;
      this.buckets[key].lastRefill = Date.now();
    }
  }

  serialize(): string {
    return JSON.stringify(this.buckets);
  }

  // Type-guard validated deserialization — rejects malformed entries
  deserialize(data: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new SyntaxError('Invalid JSON in deserialize');
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new TypeError('Expected object payload in deserialize');
    }

    const safe: { [key: string]: RateLimitEntry } = Object.create(null);
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (isRateLimitEntry(v)) {
        safe[k] = { tokens: v.tokens, lastRefill: v.lastRefill };
      }
    }
    this.buckets = safe;
  }
}
