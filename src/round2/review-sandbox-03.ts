export interface ReviewRecord03 {
  readonly id: number;
  readonly team: string;
  readonly author: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type StoredReviewRecord03 = {
  id: number;
  team: string;
  author: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ReviewSandbox03 {
  private records: StoredReviewRecord03[] = [];
  private nextId = 1;

  createRecord(team: string, author: string, body: string): ReviewRecord03 {
    const record: ReviewRecord03 = {
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
    const url = new URL(`/records/${recordId}`, baseUrl);
    url.searchParams.set('team', record.team);
    url.searchParams.set('author', record.author);
    return url.toString();
  }

  overwriteMatches(
    matcher: Readonly<Partial<Pick<ReviewRecord03, 'id' | 'team' | 'author' | 'body'>>>,
    nextBody: string
  ): number {
    const normalizedBody = nextBody.trim();
    if (normalizedBody.length === 0) return 0;
    let changed = 0;
    for (const record of this.records) {
      const matches =
        (matcher.id === undefined || record.id === matcher.id) &&
        (matcher.team === undefined || record.team === matcher.team) &&
        (matcher.author === undefined || record.author === matcher.author) &&
        (matcher.body === undefined || record.body === matcher.body);
      if (!matches) continue;
      record.body = normalizedBody;
      record.updatedAt = new Date();
      changed++;
    }
    return changed;
  }

  groupByTeam(): Record<string, ReviewRecord03[]> {
    const groups = new Map<string, ReviewRecord03[]>();
    for (const record of this.records) {
      const snapshot: ReviewRecord03 = {
        ...record,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      };
      const bucket = groups.get(record.team);
      if (bucket) {
        bucket.push(snapshot);
      } else {
        groups.set(record.team, [snapshot]);
      }
    }
    return Object.fromEntries(groups);
  }

  loadRecords(jsonString: string): number {
    let items: unknown;
    try {
      items = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue;
      const team = typeof item.team === 'string' ? item.team.trim() : '';
      const author = typeof item.author === 'string' ? item.author.trim() : '';
      const body = typeof item.body === 'string' ? item.body : '';
      const createdAt = new Date(typeof item.createdAt === 'string' ? item.createdAt : '');
      const updatedAt = new Date(typeof item.updatedAt === 'string' ? item.updatedAt : typeof item.createdAt === 'string' ? item.createdAt : '');
      if (!team || !author || body.length === 0) continue;
      if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) continue;
      this.records.push({
        id: this.nextId++,
        team,
        author,
        body,
        createdAt,
        updatedAt,
      });
      loaded++;
    }
    return loaded;
  }

  calculateSearchWeight(recordId: number, terms: string[]): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record || record.body.length === 0 || terms.length === 0) return 0;
    const haystack = record.body.toLowerCase();
    let total = 0;
    for (const term of terms) {
      const needle = term.trim().toLowerCase();
      if (!needle) continue;
      let index = haystack.indexOf(needle);
      while (index !== -1) {
        total++;
        index = haystack.indexOf(needle, index + needle.length);
      }
    }
    return total / record.body.length;
  }
}
