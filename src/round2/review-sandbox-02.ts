export interface ReviewRecord02 {
  id: number;
  team: string;
  author: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReviewSandbox02 {
  private records: ReviewRecord02[] = [];
  private nextId = 1;

  createRecord(team: string, author: string, body: string): ReviewRecord02 {
    const record: ReviewRecord02 = {
      id: this.nextId++,
      team,
      author,
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
    return `${baseUrl}/records/${recordId}?team=${record.team}&author=${record.author}`;
  }

  overwriteMatches(matcher: Record<string, any>, nextBody: string): number {
    let changed = 0;
    for (const record of this.records) {
      let matches = true;
      for (const key of Object.keys(matcher)) {
        if ((record as any)[key] !== matcher[key]) {
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

  groupByTeam(): Record<string, ReviewRecord02[]> {
    const groups: Record<string, ReviewRecord02[]> = {};
    for (const record of this.records) {
      if (!groups[record.team]) {
        groups[record.team] = [];
      }
      groups[record.team].push(record);
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
        team: String(item.team),
        author: String(item.author),
        body: String(item.body),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt || item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  calculateSearchWeight(recordId: number, terms: string[]): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return 0;
    let total = 0;
    for (const term of terms) {
      const matches = record.body.match(new RegExp(term, 'gi'));
      total += matches ? matches.length : 0;
    }
    return total / record.body.length;
  }
}
