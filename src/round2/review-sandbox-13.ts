export interface ReviewRecord13 {
  readonly id: number;
  readonly team: string;
  readonly author: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type RecordShape13 = {
  id: number;
  team: string;
  author: string;
  body: string;
  createdAtMs: number;
  updatedAtMs: number;
  terms: Set<string>;
};

type MatchableField13 = 'id' | 'team' | 'author' | 'body';

function toSnapshot13(record: RecordShape13): ReviewRecord13 {
  return {
    id: record.id,
    team: record.team,
    author: record.author,
    body: record.body,
    createdAt: new Date(record.createdAtMs),
    updatedAt: new Date(record.updatedAtMs),
  };
}

function normalizeText13(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize13(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map(part => part.trim())
      .filter(Boolean)
  );
}

function decodeCandidate13(value: unknown): Omit<RecordShape13, 'id' | 'terms'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const team = normalizeText13(value.team);
  const author = normalizeText13(value.author);
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

function createPredicate13(matcher: unknown): (record: RecordShape13) => boolean {
  if (typeof matcher !== 'object' || matcher === null) {
    return () => false;
  }

  const conditions: Array<(record: RecordShape13) => boolean> = [];
  const entries = Object.entries(matcher as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (key === 'id' && typeof value === 'number') {
      conditions.push(record => record.id === value);
      continue;
    }
    if ((['team', 'author', 'body'] as MatchableField13[]).includes(key as MatchableField13) && typeof value === 'string') {
      conditions.push(record => record[key as Exclude<MatchableField13, 'id'>] === value);
      continue;
    }
    return () => false;
  }

  return record => conditions.every(condition => condition(record));
}

export class ReviewSandbox13 {
  private records = new Map<number, RecordShape13>();
  private nextId = 1;

  createRecord(team: string, author: string, body: string): ReviewRecord13 {
    const now = Date.now();
    const normalizedTeam = normalizeText13(team);
    const normalizedAuthor = normalizeText13(author);
    const record: RecordShape13 = {
      id: this.nextId++,
      team: normalizedTeam,
      author: normalizedAuthor,
      body,
      createdAtMs: now,
      updatedAtMs: now,
      terms: tokenize13(body),
    };
    this.records.set(record.id, record);
    return toSnapshot13(record);
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.get(recordId);
    if (!record) return '';
    const url = new URL(`/records/${recordId}`, baseUrl);
    const envelope = Buffer.from(
      JSON.stringify({ team: record.team, author: record.author }),
      'utf8'
    ).toString('base64url');
    url.hash = `lookup=${envelope}`;
    return url.toString();
  }

  overwriteMatches(matcher: unknown, nextBody: string): number {
    const replacement = nextBody.trim();
    if (!replacement) return 0;
    const predicate = createPredicate13(matcher);
    let changed = 0;
    for (const record of this.records.values()) {
      if (!predicate(record)) continue;
      record.body = replacement;
      record.updatedAtMs = Date.now();
      record.terms = tokenize13(replacement);
      changed++;
    }
    return changed;
  }

  groupByTeam(): Record<string, ReviewRecord13[]> {
    const grouped = new Map<string, ReviewRecord13[]>();
    for (const record of this.records.values()) {
      const snapshot = toSnapshot13(record);
      const existing = grouped.get(snapshot.team) ?? [];
      existing.push(snapshot);
      grouped.set(snapshot.team, existing);
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
      const decoded = decodeCandidate13(candidate);
      if (!decoded) continue;
      const record: RecordShape13 = {
        id: this.nextId++,
        ...decoded,
        terms: tokenize13(decoded.body),
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
        .map(normalizeText13)
        .flatMap(term => [...tokenize13(term)])
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
