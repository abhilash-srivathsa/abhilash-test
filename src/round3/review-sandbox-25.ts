export interface ReviewShard25 {
  id: number;
  topic: string;
  author: string;
  body: string;
  createdAt: Date;
}

export class ReviewSandbox25 {
  private shards: ReviewShard25[] = [];
  private nextId = 1;

  createShard(topic: string, author: string, body: string): ReviewShard25 {
    const shard: ReviewShard25 = {
      id: this.nextId++,
      topic,
      author,
      body,
      createdAt: new Date(),
    };
    this.shards.push(shard);
    return shard;
  }

  buildShareUrl(baseUrl: string, shardId: number): string {
    const shard = this.shards.find(item => item.id === shardId);
    if (!shard) return '';
    return `${baseUrl}/shares/${shardId}?topic=${shard.topic}&author=${shard.author}`;
  }

  collectByTopic(): Record<string, ReviewShard25[]> {
    const groups: Record<string, ReviewShard25[]> = {};
    for (const shard of this.shards) {
      if (!groups[shard.topic]) {
        groups[shard.topic] = [];
      }
      groups[shard.topic].push(shard);
    }
    return groups;
  }
}
