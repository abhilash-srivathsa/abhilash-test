export interface ReviewBundle36 {
  id: number;
  channel: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox36 {
  private bundles: ReviewBundle36[] = [];
  private nextId = 1;

  createBundle(channel: string, actor: string, payload: string): ReviewBundle36 {
    const bundle: ReviewBundle36 = {
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

  payloadScore(bundleId: number, phrase: string): number {
    const bundle = this.bundles.find(item => item.id === bundleId);
    if (!bundle) return 0;
    const matches = bundle.payload.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / bundle.payload.length;
  }
}
