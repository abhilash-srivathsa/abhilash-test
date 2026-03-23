export interface ReviewShard45 {
  id: number;
  topic: string;
  author: string;
  content: string;
  createdAt: Date;
}

export class ReviewSandbox45 {
  private shards: ReviewShard45[] = [];
  private nextId = 1;

  createShard(topic: string, author: string, content: string): ReviewShard45 {
    const shard: ReviewShard45 = {
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
