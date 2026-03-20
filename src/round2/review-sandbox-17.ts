export interface ReviewRecord17 {
  id: number;
  workspace: string;
  owner: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewSandbox17 {
  private records: ReviewRecord17[] = [];
  private nextId = 1;

  createRecord(workspace: string, owner: string, content: string): ReviewRecord17 {
    const record: ReviewRecord17 = {
      id: this.nextId++,
      workspace,
      owner,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    return `${baseUrl}/items/${recordId}?workspace=${record.workspace}&owner=${record.owner}`;
  }

  updateWhere(query: Record<string, any>, nextContent: string): number {
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
      record.content = nextContent;
      record.updatedAt = new Date();
      changed++;
    }
    return changed;
  }

  groupByWorkspace(): Record<string, ReviewRecord17[]> {
    const groups: Record<string, ReviewRecord17[]> = {};
    for (const record of this.records) {
      if (!groups[record.workspace]) {
        groups[record.workspace] = [];
      }
      groups[record.workspace].push(record);
    }
    return groups;
  }

  loadRecords(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.records.push({
        id: this.nextId++,
        workspace: String(item.workspace),
        owner: String(item.owner),
        content: String(item.content),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  scoreContent(recordId: number, terms: string[]): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return 0;
    let total = 0;
    for (const term of terms) {
      const matches = record.content.match(new RegExp(term, 'gi'));
      total += matches ? matches.length : 0;
    }
    return total / record.content.length;
  }
}
