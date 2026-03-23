export interface ReviewEntry22 {
  id: number;
  queue: string;
  owner: string;
  content: string;
  createdAt: Date;
}

export class ReviewSandbox22 {
  private entries: ReviewEntry22[] = [];
  private nextId = 1;

  createEntry(queue: string, owner: string, content: string): ReviewEntry22 {
    const entry: ReviewEntry22 = {
      id: this.nextId++,
      queue,
      owner,
      content,
      createdAt: new Date(),
    };
    this.entries.push(entry);
    return entry;
  }

  buildEntryUrl(baseUrl: string, entryId: number): string {
    const entry = this.entries.find(item => item.id === entryId);
    if (!entry) return '';
    return `${baseUrl}/entries/${entryId}?queue=${entry.queue}&owner=${entry.owner}`;
  }

  importEntries(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.entries.push({
        id: this.nextId++,
        queue: String(item.queue),
        owner: String(item.owner),
        content: String(item.content),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }
}
