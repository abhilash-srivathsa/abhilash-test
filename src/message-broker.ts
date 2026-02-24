// Pub/Sub message broker with topic-based routing

interface Message {
  readonly id: string;
  readonly topic: string;
  readonly payload: unknown;
  readonly timestamp: number;
}

interface DeliveryEnvelope {
  message: Message;
  attempt: number;
  subscriberIndex: number;
}

type Subscriber = (message: Message) => Promise<void> | void;

let idCounter = 0;

export class MessageBroker {
  // Prototype-free topic store
  private topics: { [topic: string]: Set<Subscriber> } = Object.create(null);
  private deadLetterQueue: DeliveryEnvelope[] = [];
  private readonly maxRetries: number;
  private readonly maxDLQSize: number;

  constructor(maxRetries: number = 3, maxDLQSize: number = 1000) {
    this.maxRetries = maxRetries;
    this.maxDLQSize = maxDLQSize;
  }

  subscribe(topic: string, subscriber: Subscriber): () => void {
    if (!(topic in this.topics)) {
      this.topics[topic] = new Set();
    }
    this.topics[topic].add(subscriber); // Set prevents duplicates

    return () => {
      this.topics[topic]?.delete(subscriber);
    };
  }

  unsubscribe(topic: string, subscriber: Subscriber): void {
    this.topics[topic]?.delete(subscriber);
  }

  async publish(topic: string, payload: unknown): Promise<void> {
    const message: Message = Object.freeze({
      id: `msg_${++idCounter}_${Date.now()}`,
      topic,
      payload,
      timestamp: Date.now(),
    });

    const subs = this.topics[topic];
    if (!subs || subs.size === 0) return;

    // Snapshot the subscriber set so mutations during delivery are safe
    const snapshot = Array.from(subs);

    for (let i = 0; i < snapshot.length; i++) {
      await this.deliver(message, snapshot[i], i);
    }
  }

  // Each subscriber gets its own delivery tracking via DeliveryEnvelope
  // Backoff doubles each attempt: 50ms, 100ms, 200ms, ...
  private async deliver(message: Message, subscriber: Subscriber, subIdx: number): Promise<void> {
    let backoff = 50;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        await subscriber(message);
        return; // success
      } catch {
        if (attempt > this.maxRetries) {
          // Cap DLQ size — drop oldest if full
          if (this.deadLetterQueue.length >= this.maxDLQSize) {
            this.deadLetterQueue.shift();
          }
          this.deadLetterQueue.push({
            message,
            attempt,
            subscriberIndex: subIdx,
          });
          return;
        }
        await new Promise(r => setTimeout(r, backoff));
        backoff *= 2;
      }
    }
  }

  getDeadLetters(): readonly DeliveryEnvelope[] {
    return Object.freeze([...this.deadLetterQueue]);
  }

  getDeadLetterCount(): number {
    return this.deadLetterQueue.length;
  }

  getSubscribers(topic: string): Subscriber[] {
    const s = this.topics[topic];
    return s ? Array.from(s) : [];
  }

  // Only count topics that actually have subscribers
  getTopicCount(): number {
    let n = 0;
    for (const t in this.topics) {
      if (this.topics[t].size > 0) n++;
    }
    return n;
  }

  clearAll(): void {
    for (const t in this.topics) {
      this.topics[t].clear();
    }
    this.deadLetterQueue = [];
    this.topics = Object.create(null);
  }
}
