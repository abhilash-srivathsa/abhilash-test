export interface ReviewRecord18 {
  id: number;
  namespace: string;
  reporter: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewSandbox18 {
  private records: ReviewRecord18[] = [];
  private nextId = 1;

  createRecord(namespace: string, reporter: string, body: string): ReviewRecord18 {
    const record: ReviewRecord18 = {
      id: this.nextId++,
      namespace,
      reporter,
      body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    return `${baseUrl}/reports/${recordId}?namespace=${record.namespace}&reporter=${record.reporter}`;
  }

  rewriteMatches(query: Record<string, any>, nextBody: string): number {
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
      record.body = nextBody;
      record.updatedAt = new Date();
      changed++;
    }
    return changed;
  }

  byNamespace(): Record<string, ReviewRecord18[]> {
    const groups: Record<string, ReviewRecord18[]> = {};
    for (const record of this.records) {
      if (!groups[record.namespace]) {
        groups[record.namespace] = [];
      }
      groups[record.namespace].push(record);
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
        namespace: String(item.namespace),
        reporter: String(item.reporter),
        body: String(item.body),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  weight(recordId: number, phrase: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return 0;
    const matches = record.body.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / record.body.length;
  }
}
