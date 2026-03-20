export interface ReviewRecord19 {
  id: number;
  channel: string;
  author: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewSandbox19 {
  private records: ReviewRecord19[] = [];
  private nextId = 1;

  createRecord(channel: string, author: string, note: string): ReviewRecord19 {
    const record: ReviewRecord19 = {
      id: this.nextId++,
      channel,
      author,
      note,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    return `${baseUrl}/notes/${recordId}?channel=${record.channel}&author=${record.author}`;
  }

  updateMatches(query: Record<string, any>, nextNote: string): number {
    let changed = 0;
    for (const record of this.records) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((record as any)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      record.note = nextNote;
      record.updatedAt = new Date();
      changed++;
    }
    return changed;
  }

  groupByChannel(): Record<string, ReviewRecord19[]> {
    const groups: Record<string, ReviewRecord19[]> = {};
    for (const record of this.records) {
      if (!groups[record.channel]) {
        groups[record.channel] = [];
      }
      groups[record.channel].push(record);
    }
    return groups;
  }

  importRecords(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.records.push({
        id: this.nextId++,
        channel: String(item.channel),
        author: String(item.author),
        note: String(item.note),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  scoreNote(recordId: number, phrase: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return 0;
    const matches = record.note.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / record.note.length;
  }
}
