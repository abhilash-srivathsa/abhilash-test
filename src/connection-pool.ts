// Database-like connection pool manager

interface Connection {
  readonly id: string;
  active: boolean;
  createdAt: number;
  lastUsed: number;
}

export class ConnectionPool {
  private connections: Connection[] = [];
  private readonly owned = new Set<string>(); // track IDs that belong to this pool
  private seq = 0;
  private readonly maxSize: number;
  private readonly maxIdleTime: number;

  constructor(maxSize: number = 10, maxIdleTime: number = 60000) {
    if (maxSize < 1) throw new RangeError('maxSize must be at least 1');
    this.maxSize = maxSize;
    this.maxIdleTime = maxIdleTime;
  }

  private createConnection(): Connection {
    const conn: Connection = {
      id: `conn_${++this.seq}_${Date.now()}`,
      active: false,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };
    this.owned.add(conn.id);
    return conn;
  }

  acquire(): Connection | null {
    // Evict stale idle connections first
    this.evictStale();

    const idle = this.connections.find(c => !c.active);
    if (idle) {
      idle.active = true;
      idle.lastUsed = Date.now();
      return idle;
    }

    if (this.connections.length < this.maxSize) {
      const conn = this.createConnection();
      conn.active = true;
      this.connections.push(conn);
      return conn;
    }

    return null;
  }

  release(connection: Connection): void {
    if (!this.owned.has(connection.id)) {
      throw new Error(`Connection "${connection.id}" does not belong to this pool`);
    }
    if (!connection.active) return; // already released — idempotent
    connection.active = false;
    connection.lastUsed = Date.now();
  }

  // Use filter() to rebuild the array — no splice/index issues at all
  evictStale(): number {
    const now = Date.now();
    const before = this.connections.length;
    this.connections = this.connections.filter(c => {
      if (!c.active && now - c.lastUsed > this.maxIdleTime) {
        this.owned.delete(c.id);
        return false;
      }
      return true;
    });
    return before - this.connections.length;
  }

  // Frozen shallow copies — caller can't mutate pool internals
  getAll(): readonly Connection[] {
    return Object.freeze(this.connections.map(c => ({ ...c })));
  }

  get size(): number {
    return this.connections.length;
  }

  get activeCount(): number {
    let n = 0;
    for (const c of this.connections) if (c.active) n++;
    return n;
  }

  // Graceful: only destroy idle connections, refuse if any are active
  destroy(): void {
    const busy = this.connections.filter(c => c.active);
    if (busy.length > 0) {
      throw new Error(`Cannot destroy pool: ${busy.length} connection(s) still active`);
    }
    for (const c of this.connections) this.owned.delete(c.id);
    this.connections = [];
  }

  toJSON(): string {
    // Expose only safe summary, not raw internal state
    return JSON.stringify({
      size: this.connections.length,
      active: this.activeCount,
      idle: this.connections.length - this.activeCount,
    });
  }
}
