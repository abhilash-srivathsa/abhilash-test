import { createHash } from 'node:crypto';

export interface ReviewShard35 {
  readonly id: number;
  readonly topic: string;
  readonly author: string;
  readonly content: string;
  readonly createdAt: Date;
}

type StoredShard35 = {
  id: number;
  topic: string;
  author: string;
  content: string;
  createdAtMs: number;
};

function normalizeText35(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot35(shard: StoredShard35): ReviewShard35 {
  return {
    id: shard.id,
    topic: shard.topic,
    author: shard.author,
    content: shard.content,
    createdAt: new Date(shard.createdAtMs),
  };
}

function createLookupToken35(shard: StoredShard35): string {
  return createHash('sha256')
    .update(`${shard.id}:${shard.topic}:${shard.author}:${shard.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox35 {
  private shards: StoredShard35[] = [];
  private nextId = 1;

  createShard(topic: string, author: string, content: string): ReviewShard35 {
    const shard: StoredShard35 = {
      id: this.nextId++,
      topic: normalizeText35(topic) || 'general-topic',
      author: normalizeText35(author) || 'unknown-author',
      content: normalizeText35(content) || '[empty shard]',
      createdAtMs: Date.now(),
    };
    this.shards.push(shard);
    return snapshot35(shard);
  }

  buildShareUrl(baseUrl: string, shardId: number): string {
    const shard = this.shards.find(item => item.id === shardId);
    if (!shard) return '';
    const url = new URL(`/shares/${shardId}`, baseUrl);
    url.hash = `share=${createLookupToken35(shard)}`;
    return url.toString();
  }
}
