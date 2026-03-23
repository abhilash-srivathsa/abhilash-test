export interface ReviewShard35 {
  id: number;
  topic: string;
  author: string;
  content: string;
  createdAt: Date;
}

export class ReviewSandbox35 {
  private shards: ReviewShard35[] = [];
  private nextId = 1;

  createShard(topic: string, author: string, content: string): ReviewShard35 {
    const shard: ReviewShard35 = {
      id: this.nextId++,
      topic,
      author,
      content,
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
}
