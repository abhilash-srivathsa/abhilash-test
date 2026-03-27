// Pub/Sub message broker with topic-based routing

// Subscribers receive (topic, payload, metadata) — no mutable Message object exists
type Subscriber = (topic: string, payload: unknown, meta: Readonly<{ id: string; ts: number }>) => Promise<void> | void;

interface DeadLetter {
  topic: string;
  payload: unknown;
  id: string;
  reason: string;
}

let seq = 0;

export class MessageBroker {
  private channels = new Map<string, Set<Subscriber>>();
  private dlq: DeadLetter[] = [];
  private readonly maxRetries: number;
  private readonly dlqCap: number;

  constructor(maxRetries: number = 3, dlqCap: number = 500) {
    this.maxRetries = maxRetries;
    this.dlqCap = dlqCap;
  }

  subscribe(topic: string, subscriber: Subscriber): () => void {
    if (!this.channels.has(topic)) {
      this.channels.set(topic, new Set());
    }
    this.channels.get(topic)!.add(subscriber);
    return () => this.channels.get(topic)?.delete(subscriber);
  }

  unsubscribe(topic: string, subscriber: Subscriber): void {
    this.channels.get(topic)?.delete(subscriber);
  }

  // Publish fans out to each subscriber with independent retry + backoff.
  // No Message object is shared — each subscriber receives primitive args.
  async publish(topic: string, payload: unknown): Promise<void> {
    const ch = this.channels.get(topic);
    if (!ch || ch.size === 0) return;

    const id = `m${++seq}`;
    const ts = Date.now();
    const meta = Object.freeze({ id, ts });

    // Snapshot into array so subscribe/unsubscribe during delivery is safe
    const targets = Array.from(ch);

    await Promise.allSettled(
      targets.map(sub => this.tryDeliver(sub, topic, payload, meta)),
    );
  }

  private async tryDeliver(
    sub: Subscriber,
    topic: string,
    payload: unknown,
    meta: Readonly<{ id: string; ts: number }>,
  ): Promise<void> {
    let pause = 100;
    let lastErr: unknown;

    for (let n = 0; n <= this.maxRetries; n++) {
      try {
        // Each call receives fresh args — nothing to mutate
        await sub(topic, payload, meta);
        return;
      } catch (err) {
        lastErr = err;
        if (n < this.maxRetries) {
          await new Promise(r => setTimeout(r, pause));
          pause += pause; // double
        }
      }
    }

    // Dead-letter with capped queue
    if (this.dlq.length >= this.dlqCap) this.dlq.splice(0, 1);
    this.dlq.push({
      topic,
      payload,
      id: meta.id,
      reason: lastErr instanceof Error ? lastErr.message : String(lastErr),
    });
  }

  getDeadLetters(): DeadLetter[] {
    return this.dlq.map(d => ({ ...d }));
  }

  getDeadLetterCount(): number {
    return this.dlq.length;
  }

  getSubscribers(topic: string): Subscriber[] {
    return Array.from(this.channels.get(topic) ?? []);
  }

  getTopicCount(): number {
    let n = 0;
    for (const [, subs] of this.channels) {
      if (subs.size > 0) n++;
    }
    return n;
  }

  clearAll(): void {
    this.channels.clear();
    this.dlq = [];
  }
}
