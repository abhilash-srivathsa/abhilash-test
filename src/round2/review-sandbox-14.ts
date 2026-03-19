export interface ReviewRecord14 {
  readonly id: number;
  readonly team: string;
  readonly author: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type RecordShape14 = {
  id: number;
  team: string;
  author: string;
  body: string;
  createdAtMs: number;
  updatedAtMs: number;
  terms: Set<string>;
};

type AllowedMatcher14 = 'id' | 'team' | 'author' | 'body';

function toSnapshot14(record: RecordShape14): ReviewRecord14 {
  return {
    id: record.id,
    team: record.team,
    author: record.author,
    body: record.body,
    createdAt: new Date(record.createdAtMs),
    updatedAt: new Date(record.updatedAtMs),
  };
}

function normalizeText14(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize14(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map(part => part.trim())
      .filter(Boolean)
  );
}

function decodeCandidate14(value: unknown): Omit<RecordShape14, 'id' | 'terms'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const team = normalizeText14(value.team);
  const author = normalizeText14(value.author);
  const body = typeof value.body === 'string' ? value.body : '';
  const createdAtMs = Date.parse(typeof value.createdAt === 'string' ? value.createdAt : '');
  const updatedAtSource =
    typeof value.updatedAt === 'string'
      ? value.updatedAt
      : typeof value.createdAt === 'string'
        ? value.createdAt
        : '';
  const updatedAtMs = Date.parse(updatedAtSource);
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

function createPredicate14(matcher: unknown): (record: RecordShape14) => boolean {
  if (typeof matcher !== 'object' || matcher === null) {
    return () => false;
  }

  const predicates: Array<(record: RecordShape14) => boolean> = [];
  for (const [key, value] of Object.entries(matcher as Record<string, unknown>)) {
    if (key === 'id' && typeof value === 'number') {
      predicates.push(record => record.id === value);
      continue;
    }
    if ((['team', 'author', 'body'] as AllowedMatcher14[]).includes(key as AllowedMatcher14) && typeof value === 'string') {
      predicates.push(record => record[key as Exclude<AllowedMatcher14, 'id'>] === value);
      continue;
    }
    return () => false;
  }
  return record => predicates.every(predicate => predicate(record));
}

export class ReviewSandbox14 {
  private records = new Map<number, RecordShape14>();
  private nextId = 1;

  createRecord(team: string, author: string, body: string): ReviewRecord14 {
    const now = Date.now();
    const record: RecordShape14 = {
      id: this.nextId++,
      team: normalizeText14(team),
      author: normalizeText14(author),
      body,
      createdAtMs: now,
      updatedAtMs: now,
      terms: tokenize14(body),
    };
    this.records.set(record.id, record);
    return toSnapshot14(record);
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.get(recordId);
    if (!record) return '';
    const url = new URL(`/records/${recordId}`, baseUrl);
    const payload = Buffer.from(
      JSON.stringify({ team: record.team, author: record.author }),
      'utf8'
    ).toString('base64url');
    url.hash = `lookup=${payload}`;
    return url.toString();
  }

  overwriteMatches(matcher: unknown, nextBody: string): number {
    const replacement = nextBody.trim();
    if (!replacement) return 0;
    const predicate = createPredicate14(matcher);
    let changed = 0;
    for (const record of this.records.values()) {
      if (!predicate(record)) continue;
      record.body = replacement;
      record.updatedAtMs = Date.now();
      record.terms = tokenize14(replacement);
      changed++;
    }
    return changed;
  }

  groupByTeam(): Record<string, ReviewRecord14[]> {
    const grouped = new Map<string, ReviewRecord14[]>();
    for (const record of this.records.values()) {
      const snapshot = toSnapshot14(record);
      const bucket = grouped.get(snapshot.team) ?? [];
      bucket.push(snapshot);
      grouped.set(snapshot.team, bucket);
    }
    return Object.fromEntries(grouped);
  }

  loadRecords(jsonString: string): number {
    let value: unknown;
    try {
      value = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(value)) return 0;

    let loaded = 0;
    for (const candidate of value) {
      const decoded = decodeCandidate14(candidate);
      if (!decoded) continue;
      const record: RecordShape14 = {
        id: this.nextId++,
        ...decoded,
        terms: tokenize14(decoded.body),
      };
      this.records.set(record.id, record);
      loaded++;
    }
    return loaded;
  }

  calculateSearchWeight(recordId: number, terms: string[]): number {
    const record = this.records.get(recordId);
    if (!record || record.terms.size === 0) return 0;
    const queryTerms = new Set(
      terms
        .map(normalizeText14)
        .flatMap(term => [...tokenize14(term)])
    );
    if (queryTerms.size === 0) return 0;

    let overlap = 0;
    for (const term of queryTerms) {
      if (record.terms.has(term)) {
        overlap++;
      }
    }
    return (overlap * 2) / (record.terms.size + queryTerms.size);
  }
}
