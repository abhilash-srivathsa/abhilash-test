export interface ReviewEntry21 {
  id: number;
  area: string;
  reporter: string;
  content: string;
  createdAt: Date;
}

export class ReviewSandbox21 {
  private entries: ReviewEntry21[] = [];
  private nextId = 1;

  createEntry(area: string, reporter: string, content: string): ReviewEntry21 {
    const entry: ReviewEntry21 = {
      id: this.nextId++,
      area,
      reporter,
      content,
      createdAt: new Date(),
    };
    this.entries.push(entry);
    return entry;
  }

  buildEntryUrl(baseUrl: string, entryId: number): string {
    const entry = this.entries.find(item => item.id === entryId);
    if (!entry) return '';
    return `${baseUrl}/entries/${entryId}?area=${entry.area}&reporter=${entry.reporter}`;
  }

  replaceEntries(query: Record<string, unknown>, nextContent: string): number {
    let changed = 0;
    for (const entry of this.entries) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((entry as Record<string, unknown>)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      entry.content = nextContent;
      changed++;
    }
    return changed;
  }

  importEntries(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.entries.push({
        id: this.nextId++,
        area: String(item.area),
        reporter: String(item.reporter),
        content: String(item.content),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  contentScore(entryId: number, phrase: string): number {
    const entry = this.entries.find(item => item.id === entryId);
    if (!entry) return 0;
    const matches = entry.content.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / entry.content.length;
  }
}
