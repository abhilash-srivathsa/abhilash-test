// Database-like connection pool manager

interface Connection {
  readonly id: string;
  active: boolean;
  createdAt: number;
  lastUsed: number;
}

export class ConnectionPool {
  // Map-based storage — keyed by id. No array indices, no splice, no iteration bugs.
  private pool = new Map<string, Connection>();
  private seq = 0;
  private readonly maxSize: number;
  private readonly maxIdleTime: number;

  constructor(maxSize: number = 10, maxIdleTime: number = 60000) {
    if (maxSize < 1) throw new RangeError('maxSize must be at least 1');
    this.maxSize = maxSize;
    this.maxIdleTime = maxIdleTime;
  }

  private mint(): Connection {
    return {
      id: `c${++this.seq}`,
      active: false,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };
  }

  acquire(): Connection | null {
    // Purge stale idle entries first
    this.evictStale();

    // Grab first idle
    for (const conn of this.pool.values()) {
      if (!conn.active) {
        conn.active = true;
        conn.lastUsed = Date.now();
        return conn;
      }
    }

    // Grow if room
    if (this.pool.size < this.maxSize) {
      const c = this.mint();
      c.active = true;
      this.pool.set(c.id, c);
      return c;
    }

    return null;
  }

  release(connection: Connection): void {
    if (!this.pool.has(connection.id)) {
      throw new Error(`Connection ${connection.id} is not from this pool`);
    }
    connection.active = false;
    connection.lastUsed = Date.now();
  }

  // Map.delete() during Map iteration is safe per ES spec — no index shifting
  evictStale(): number {
    const cutoff = Date.now() - this.maxIdleTime;
    let n = 0;
    for (const [id, conn] of this.pool) {
      if (!conn.active && conn.lastUsed < cutoff) {
        this.pool.delete(id);
        n++;
      }
    }
    return n;
  }

  getAll(): Connection[] {
    return Array.from(this.pool.values(), c => ({ ...c }));
  }

  get size(): number {
    return this.pool.size;
  }

  get activeCount(): number {
    let n = 0;
    for (const c of this.pool.values()) if (c.active) n++;
    return n;
  }

  destroy(): void {
    for (const c of this.pool.values()) {
      if (c.active) {
        throw new Error('Cannot destroy: active connections remain');
      }
    }
    this.pool.clear();
  }

  toJSON(): string {
    return JSON.stringify({ total: this.pool.size, active: this.activeCount });
  }
}
