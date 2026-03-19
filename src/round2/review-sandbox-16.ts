export interface ReviewRecord16 {
  readonly id: number;
  readonly team: string;
  readonly author: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type StoredRecord16 = {
  id: number;
  team: string;
  author: string;
  body: string;
  createdAtMs: number;
  updatedAtMs: number;
  searchBag: Map<string, number>;
};

function cleanText16(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function buildBag16(value: string): Map<string, number> {
  const bag = new Map<string, number>();
  for (const token of value.toLowerCase().split(/[^a-z0-9]+/i)) {
    const normalized = token.trim();
    if (!normalized) continue;
    bag.set(normalized, (bag.get(normalized) ?? 0) + 1);
  }
  return bag;
}

function snapshot16(record: StoredRecord16): ReviewRecord16 {
  return {
    id: record.id,
    team: record.team,
    author: record.author,
    body: record.body,
    createdAt: new Date(record.createdAtMs),
    updatedAt: new Date(record.updatedAtMs),
  };
}

function decodeCandidate16(value: unknown): Omit<StoredRecord16, 'id' | 'searchBag'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const team = cleanText16(value.team);
  const author = cleanText16(value.author);
  const body = typeof value.body === 'string' ? value.body : '';
  const createdAtMs = Date.parse(typeof value.createdAt === 'string' ? value.createdAt : '');
  const updatedAtMs = Date.parse(
    typeof value.updatedAt === 'string'
      ? value.updatedAt
      : typeof value.createdAt === 'string'
        ? value.createdAt
        : ''
  );
  if (!team || !author || !body.trim()) return null;
  if (!Number.isFinite(createdAtMs) || !Number.isFinite(updatedAtMs)) return null;
  return {
    team,
    author,
    body,
    createdAtMs,
    updatedAtMs,
  };
}

function createMatcher16(matcher: unknown): (record: StoredRecord16) => boolean {
  if (typeof matcher !== 'object' || matcher === null) {
    return () => false;
  }

  const checks: Array<(record: StoredRecord16) => boolean> = [];
  for (const [key, value] of Object.entries(matcher as Record<string, unknown>)) {
    if (key === 'id' && typeof value === 'number') {
      checks.push(record => record.id === value);
      continue;
    }
    if ((key === 'team' || key === 'author' || key === 'body') && typeof value === 'string') {
      checks.push(record => record[key] === value);
      continue;
    }
    return () => false;
  }

  return record => checks.every(check => check(record));
}

export class ReviewSandbox16 {
  private records: StoredRecord16[] = [];
  private nextId = 1;

  createRecord(team: string, author: string, body: string): ReviewRecord16 {
    const now = Date.now();
    const record: StoredRecord16 = {
      id: this.nextId++,
      team: cleanText16(team),
      author: cleanText16(author),
      body,
      createdAtMs: now,
      updatedAtMs: now,
      searchBag: buildBag16(body),
    };
    this.records.push(record);
    return snapshot16(record);
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    const url = new URL(baseUrl);
    url.pathname = [
      url.pathname.replace(/\/$/, ''),
      'records',
      String(recordId),
      'team',
      encodeURIComponent(record.team),
      'author',
      encodeURIComponent(record.author),
    ]
      .filter(Boolean)
      .join('/');
    return url.toString();
  }

  overwriteMatches(matcher: unknown, nextBody: string): number {
    const replacement = nextBody.trim();
    if (!replacement) return 0;
    const match = createMatcher16(matcher);
    let changed = 0;
    this.records = this.records.map(record => {
      if (!match(record)) return record;
      changed++;
      return {
        ...record,
        body: replacement,
        updatedAtMs: Date.now(),
        searchBag: buildBag16(replacement),
      };
    });
    return changed;
  }

  groupByTeam(): Record<string, ReviewRecord16[]> {
    return this.records.reduce<Record<string, ReviewRecord16[]>>((groups, record) => {
      const snapshot = snapshot16(record);
      groups[snapshot.team] = groups[snapshot.team] ?? [];
      groups[snapshot.team].push(snapshot);
      return groups;
    }, {});
  }

  loadRecords(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const value of parsed) {
      const decoded = decodeCandidate16(value);
      if (!decoded) continue;
      this.records.push({
        id: this.nextId++,
        ...decoded,
        searchBag: buildBag16(decoded.body),
      });
      loaded++;
    }
    return loaded;
  }

  calculateSearchWeight(recordId: number, terms: string[]): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record || record.searchBag.size === 0) return 0;

    const queryBag = new Map<string, number>();
    for (const term of terms.map(cleanText16)) {
      for (const [token, count] of buildBag16(term)) {
        queryBag.set(token, (queryBag.get(token) ?? 0) + count);
      }
    }
    if (queryBag.size === 0) return 0;

    let shared = 0;
    let total = 0;
    for (const [token, count] of queryBag) {
      total += count;
      shared += Math.min(count, record.searchBag.get(token) ?? 0);
    }
    return total === 0 ? 0 : shared / total;
  }
}
