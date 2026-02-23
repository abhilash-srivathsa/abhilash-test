// Database-like connection pool manager

interface Connection {
  id: string;
  active: boolean;
  createdAt: number;
  lastUsed: number;
}

export class ConnectionPool {
  private connections: Connection[] = [];
  private maxSize: number;
  private maxIdleTime: number;

  constructor(maxSize: number = 10, maxIdleTime: number = 60000) {
    this.maxSize = maxSize;
    this.maxIdleTime = maxIdleTime;
  }

  // BUG: ID generation uses Math.random - not unique enough for high-throughput
  // BUG: No validation of maxSize - 0 or negative values break the pool
  private createConnection(): Connection {
    return {
      id: Math.random().toString(36).slice(2),
      active: false,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };
  }

  // BUG: Race condition - two concurrent acquire() calls can grab the same idle connection
  // BUG: No wait queue - if pool is full and all connections busy, immediately returns null
  // BUG: Doesn't check if idle connections are still healthy/alive
  acquire(): Connection | null {
    // Try to find an idle connection
    const idle = this.connections.find(c => !c.active);
    if (idle) {
      idle.active = true;
      idle.lastUsed = Date.now();
      return idle;
    }

    // Create new if under max
    if (this.connections.length < this.maxSize) {
      const conn = this.createConnection();
      conn.active = true;
      this.connections.push(conn);
      return conn;
    }

    return null; // BUG: No queuing mechanism - caller gets nothing
  }

  // BUG: No validation that connection belongs to this pool
  // BUG: Doesn't check if connection was already released
  release(connection: Connection): void {
    connection.active = false;
    connection.lastUsed = Date.now();
  }

  // BUG: Removes connections while iterating forward - skips adjacent stale connections
  // BUG: Doesn't check if connection is currently active before removing
  evictStale(): number {
    const now = Date.now();
    let removed = 0;
    for (let i = 0; i < this.connections.length; i++) {
      if (now - this.connections[i].lastUsed > this.maxIdleTime) {
        this.connections.splice(i, 1);
        removed++;
        // BUG: doesn't decrement i
      }
    }
    return removed;
  }

  // BUG: Returns mutable internal array
  getAll(): Connection[] {
    return this.connections;
  }

  // BUG: Counts all connections including stale ones
  get size(): number {
    return this.connections.length;
  }

  get activeCount(): number {
    return this.connections.filter(c => c.active).length;
  }

  // BUG: Destroys all connections including active ones - no graceful shutdown
  // BUG: No cleanup of pending operations using these connections
  destroy(): void {
    this.connections = [];
  }

  // BUG: JSON.stringify on connections with potential circular refs
  // BUG: Exposes internal connection state
  toJSON(): string {
    return JSON.stringify(this.connections);
  }
}
