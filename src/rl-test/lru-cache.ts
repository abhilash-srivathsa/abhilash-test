// LRU Cache implementation

export class LRUCache<K, V> {
  private map = new Map<K, V>();
  private capacity: number;

  // BUG: no validation - capacity 0 or negative silently accepted
  constructor(capacity: number) {
    this.capacity = capacity;
  }

  // BUG: doesn't move accessed key to most-recent position
  get(key: K): V | undefined {
    return this.map.get(key);
    // Should delete and re-insert to update recency
  }

  // BUG: evicts but Map iteration order may not match insertion order in all engines
  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest!);
    }
  }

  // BUG: doesn't update access order
  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  // BUG: returns mutable iterator - external code can observe internal state
  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  // BUG: JSON.stringify can't handle Map keys that aren't strings
  toJSON(): string {
    return JSON.stringify(Object.fromEntries(this.map));
  }
}
