import { createHash } from 'node:crypto';

export interface ReviewShard25 {
  readonly id: number;
  readonly topic: string;
  readonly author: string;
  readonly body: string;
  readonly createdAt: Date;
}

type StoredShard25 = {
  id: number;
  topic: string;
  author: string;
  body: string;
  createdAtMs: number;
};

function normalizeText25(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot25(shard: StoredShard25): ReviewShard25 {
  return {
    id: shard.id,
    topic: shard.topic,
    author: shard.author,
    body: shard.body,
    createdAt: new Date(shard.createdAtMs),
  };
}

function createLookupToken25(shard: StoredShard25): string {
  return createHash('sha256')
    .update(`${shard.id}:${shard.topic}:${shard.author}:${shard.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox25 {
  private shards: StoredShard25[] = [];
  private nextId = 1;

  createShard(topic: string, author: string, body: string): ReviewShard25 {
    const normalizedTopic = normalizeText25(topic) || 'general-topic';
    const normalizedAuthor = normalizeText25(author) || 'unknown-author';
    const normalizedBody = normalizeText25(body) || '[empty shard]';

    const shard: StoredShard25 = {
      id: this.nextId++,
      topic: normalizedTopic,
      author: normalizedAuthor,
      body: normalizedBody,
      createdAtMs: Date.now(),
    };
    this.shards.push(shard);
    return snapshot25(shard);
  }

  buildShareUrl(baseUrl: string, shardId: number): string {
    const shard = this.shards.find(item => item.id === shardId);
    if (!shard) return '';
    const url = new URL(`/shares/${shardId}`, baseUrl);
    url.hash = `share=${createLookupToken25(shard)}`;
    return url.toString();
  }

  collectByTopic(): Record<string, ReviewShard25[]> {
    const groups = new Map<string, ReviewShard25[]>();
    for (const shard of this.shards) {
      const items = groups.get(shard.topic) ?? [];
      items.push(snapshot25(shard));
      groups.set(shard.topic, items);
    }
    return Object.fromEntries(groups);
  }
}
