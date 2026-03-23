import { createHash } from 'node:crypto';

// Comment-only follow-up commit for reviewer retesting.
export interface ReviewShard45 {
  readonly id: number;
  readonly topic: string;
  readonly author: string;
  readonly content: string;
  readonly createdAt: Date;
}

type StoredShard45 = {
  id: number;
  topic: string;
  author: string;
  content: string;
  createdAtMs: number;
};

function normalizeText45(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot45(shard: StoredShard45): ReviewShard45 {
  return {
    id: shard.id,
    topic: shard.topic,
    author: shard.author,
    content: shard.content,
    createdAt: new Date(shard.createdAtMs),
  };
}

function createLookupToken45(shard: StoredShard45): string {
  return createHash('sha256')
    .update(`${shard.id}:${shard.topic}:${shard.author}:${shard.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox45 {
  private shards: StoredShard45[] = [];
  private nextId = 1;

  createShard(topic: string, author: string, content: string): ReviewShard45 {
    const shard: StoredShard45 = {
      id: this.nextId++,
      topic: normalizeText45(topic) || 'general-topic',
      author: normalizeText45(author) || 'unknown-author',
      content: normalizeText45(content) || '[empty shard]',
      createdAtMs: Date.now(),
    };
    this.shards.push(shard);
    return snapshot45(shard);
  }

  buildShareUrl(baseUrl: string, shardId: number): string {
    const shard = this.shards.find(item => item.id === shardId);
    if (!shard) return '';
    const url = new URL(`/shares/${shardId}`, baseUrl);
    url.hash = `share=${createLookupToken45(shard)}`;
    return url.toString();
  }
}
// Round-2 comment-only trigger for reviewer retesting.
