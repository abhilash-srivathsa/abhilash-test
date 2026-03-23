export interface ReviewFragment38 {
  id: number;
  channel: string;
  owner: string;
  body: string;
  createdAt: Date;
}

export class ReviewSandbox38 {
  private fragments: ReviewFragment38[] = [];
  private nextId = 1;

  createFragment(channel: string, owner: string, body: string): ReviewFragment38 {
    const fragment: ReviewFragment38 = {
      id: this.nextId++,
      channel,
      owner,
      body,
      createdAt: new Date(),
    };
    this.fragments.push(fragment);
    return fragment;
  }

  importFragments(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.fragments.push({
        id: this.nextId++,
        channel: String(item.channel),
        owner: String(item.owner),
        body: String(item.body),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }
}
