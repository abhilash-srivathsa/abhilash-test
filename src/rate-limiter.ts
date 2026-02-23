// Rate limiter for API request throttling

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets: Record<string, RateLimitEntry> = {};
  private maxTokens: number;
  private refillRate: number; // tokens per second

  constructor(maxTokens: number = 10, refillRate: number = 1) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
  }

  // BUG: No cleanup of stale entries - memory grows unbounded as new keys arrive
  // BUG: Uses Record so __proto__ / constructor keys collide with Object.prototype
  // BUG: refill calculation uses integer division, losing fractional tokens
  private refill(key: string): void {
    const entry = this.buckets[key];
    if (!entry) return;

    const now = Date.now();
    const elapsed = (now - entry.lastRefill) / 1000;
    const newTokens = Math.floor(elapsed * this.refillRate); // BUG: floor loses fractional tokens

    if (newTokens > 0) {
      entry.tokens = Math.min(this.maxTokens, entry.tokens + newTokens);
      entry.lastRefill = now;
    }
  }

  // BUG: Creates entry on first check even if not consuming - probes inflate memory
  // BUG: No validation on key parameter - empty string or very long strings accepted
  consume(key: string, tokens: number = 1): boolean {
    if (!this.buckets[key]) {
      this.buckets[key] = { tokens: this.maxTokens, lastRefill: Date.now() };
    }

    this.refill(key);

    if (this.buckets[key].tokens >= tokens) {
      this.buckets[key].tokens -= tokens;
      return true;
    }

    return false;
  }

  // BUG: Returns internal mutable reference
  getStatus(key: string): RateLimitEntry | undefined {
    return this.buckets[key];
  }

  // BUG: Iterates all keys every time - O(n) with no short-circuit
  // BUG: Only counts non-empty buckets, not all tracked keys
  getActiveCount(): number {
    let count = 0;
    for (const key in this.buckets) {
      if (this.buckets[key].tokens < this.maxTokens) {
        count++;
      }
    }
    return count;
  }

  // BUG: Resets tokens but doesn't reset lastRefill - next refill gives bonus tokens
  reset(key: string): void {
    if (this.buckets[key]) {
      this.buckets[key].tokens = this.maxTokens;
    }
  }

  // BUG: JSON.stringify on potentially huge buckets object - can block event loop
  serialize(): string {
    return JSON.stringify(this.buckets);
  }

  // BUG: No validation of deserialized data - trusts shape blindly
  // BUG: Replaces entire state without merging - concurrent requests during load get lost
  deserialize(data: string): void {
    this.buckets = JSON.parse(data);
  }
}
