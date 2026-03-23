export interface ReviewFragment28 {
  id: number;
  channel: string;
  owner: string;
  body: string;
  createdAt: Date;
}

export class ReviewSandbox28 {
  private fragments: ReviewFragment28[] = [];
  private nextId = 1;

  createFragment(channel: string, owner: string, body: string): ReviewFragment28 {
    const fragment: ReviewFragment28 = {
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

  collectByChannel(): Record<string, ReviewFragment28[]> {
    const groups: Record<string, ReviewFragment28[]> = {};
    for (const fragment of this.fragments) {
      if (!groups[fragment.channel]) {
        groups[fragment.channel] = [];
      }
      groups[fragment.channel].push(fragment);
    }
    return groups;
  }
}
