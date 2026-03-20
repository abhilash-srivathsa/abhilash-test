export interface ReviewRecord20 {
  id: number;
  stream: string;
  reporter: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewSandbox20 {
  private records: ReviewRecord20[] = [];
  private nextId = 1;

  createRecord(stream: string, reporter: string, message: string): ReviewRecord20 {
    const record: ReviewRecord20 = {
      id: this.nextId++,
      stream,
      reporter,
      message,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    return `${baseUrl}/messages/${recordId}?stream=${record.stream}&reporter=${record.reporter}`;
  }

  replaceMatches(query: Record<string, any>, nextMessage: string): number {
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
      record.message = nextMessage;
      record.updatedAt = new Date();
      changed++;
    }
    return changed;
  }

  groupByStream(): Record<string, ReviewRecord20[]> {
    const groups: Record<string, ReviewRecord20[]> = {};
    for (const record of this.records) {
      if (!groups[record.stream]) {
        groups[record.stream] = [];
      }
      groups[record.stream].push(record);
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
        stream: String(item.stream),
        reporter: String(item.reporter),
        message: String(item.message),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  weightMessage(recordId: number, phrase: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return 0;
    const matches = record.message.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / record.message.length;
  }
}
