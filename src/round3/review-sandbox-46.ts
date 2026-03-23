export interface ReviewBundle46 {
  id: number;
  channel: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox46 {
  private bundles: ReviewBundle46[] = [];
  private nextId = 1;

  createBundle(channel: string, actor: string, payload: string): ReviewBundle46 {
    const bundle: ReviewBundle46 = {
      id: this.nextId++,
      channel,
      actor,
      payload,
      createdAt: new Date(),
    };
    this.bundles.push(bundle);
    return bundle;
  }

  importBundles(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.bundles.push({
        id: this.nextId++,
        channel: String(item.channel),
        actor: String(item.actor),
        payload: String(item.payload),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }
}
