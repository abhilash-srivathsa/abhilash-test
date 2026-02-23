// Pub/Sub message broker with topic-based routing

interface Message {
  id: string;
  topic: string;
  payload: any;
  timestamp: number;
  attempts: number;
}

type Subscriber = (message: Message) => Promise<void> | void;

export class MessageBroker {
  private topics: Record<string, Subscriber[]> = {};
  private deadLetterQueue: Message[] = [];
  private maxRetries: number;

  constructor(maxRetries: number = 3) {
    this.maxRetries = maxRetries;
  }

  // BUG: No limit on subscribers per topic - memory leak potential
  // BUG: Same subscriber can be added multiple times
  // BUG: No validation on topic name - empty string, __proto__ etc.
  subscribe(topic: string, subscriber: Subscriber): void {
    if (!this.topics[topic]) {
      this.topics[topic] = [];
    }
    this.topics[topic].push(subscriber);
  }

  // BUG: Uses indexOf for removal - doesn't work with anonymous/arrow functions
  unsubscribe(topic: string, subscriber: Subscriber): void {
    const subs = this.topics[topic];
    if (!subs) return;
    const idx = subs.indexOf(subscriber);
    if (idx !== -1) subs.splice(idx, 1);
  }

  // BUG: Message ID uses Math.random - collisions possible
  // BUG: No message deduplication - same message can be published twice
  // BUG: No backpressure - if subscribers are slow, publish keeps firing
  async publish(topic: string, payload: any): Promise<void> {
    const message: Message = {
      id: Math.random().toString(36).slice(2),
      topic,
      payload,
      timestamp: Date.now(),
      attempts: 0,
    };

    const subscribers = this.topics[topic];
    if (!subscribers || subscribers.length === 0) {
      // BUG: Messages to topics with no subscribers are silently lost
      return;
    }

    // BUG: Iterates original array - if subscriber modifies the list, chaos
    for (const sub of subscribers) {
      await this.deliverWithRetry(message, sub);
    }
  }

  // BUG: Retry logic mutates the original message's attempts counter
  // BUG: No exponential backoff - retries immediately
  // BUG: If all retries fail, error is swallowed
  private async deliverWithRetry(message: Message, subscriber: Subscriber): Promise<void> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        message.attempts = attempt + 1;
        await subscriber(message);
        return;
      } catch (error) {
        if (attempt === this.maxRetries) {
          // BUG: Pushes mutable reference to dead letter queue
          this.deadLetterQueue.push(message);
        }
        // BUG: No delay between retries
      }
    }
  }

  // BUG: Returns internal mutable array reference
  getDeadLetters(): Message[] {
    return this.deadLetterQueue;
  }

  // BUG: Dead letter queue grows unbounded
  // BUG: No way to replay/reprocess dead letters
  getDeadLetterCount(): number {
    return this.deadLetterQueue.length;
  }

  // BUG: Returns internal subscriber array reference
  getSubscribers(topic: string): Subscriber[] {
    return this.topics[topic] ?? [];
  }

  // BUG: Only counts top-level topic keys - doesn't verify subscribers exist
  getTopicCount(): number {
    return Object.keys(this.topics).length;
  }

  // BUG: Clears subscribers but doesn't clear dead letter queue
  // BUG: In-flight messages still reference old subscriber arrays
  clearAll(): void {
    for (const topic of Object.keys(this.topics)) {
      this.topics[topic] = [];
    }
  }
}
