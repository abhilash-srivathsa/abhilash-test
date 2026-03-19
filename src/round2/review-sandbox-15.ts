import { createHash } from 'node:crypto';

export interface ReviewRecord15 {
  readonly id: number;
  readonly team: string;
  readonly author: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type StoredRecord15 = {
  id: number;
  team: string;
  author: string;
  body: string;
  createdAtMs: number;
  updatedAtMs: number;
  terms: Set<string>;
};

type RecordDictionary15 = Record<string, unknown>;

function normalizeText15(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRequired15(value: unknown, fallback: string): string {
  const normalized = normalizeText15(value);
  return normalized.length > 0 ? normalized : fallback;
}

function tokenize15(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map(part => part.trim())
      .filter(Boolean)
  );
}

function snapshot15(record: StoredRecord15): ReviewRecord15 {
  return {
    id: record.id,
    team: record.team,
    author: record.author,
    body: record.body,
    createdAt: new Date(record.createdAtMs),
    updatedAt: new Date(record.updatedAtMs),
  };
}

function asDictionary15(value: unknown): RecordDictionary15 | null {
  return typeof value === 'object' && value !== null ? (value as RecordDictionary15) : null;
}

function decodeInput15(value: unknown): Omit<StoredRecord15, 'id' | 'terms'> | null {
  const source = asDictionary15(value);
  if (!source) return null;

  const team = normalizeText15(source.team);
  const author = normalizeText15(source.author);
  const body = typeof source.body === 'string' ? source.body : '';
  const createdAtValue = typeof source.createdAt === 'string' ? source.createdAt : '';
  const updatedAtValue = typeof source.updatedAt === 'string' ? source.updatedAt : createdAtValue;
  const createdAtMs = Date.parse(createdAtValue);
  const updatedAtMs = Date.parse(updatedAtValue);
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

function createMatcher15(matcher: unknown): (record: StoredRecord15) => boolean {
  const source = asDictionary15(matcher);
  if (!source) {
    return () => false;
  }

  const checks: Array<(record: StoredRecord15) => boolean> = [];
  for (const [key, value] of Object.entries(source)) {
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

  if (checks.length === 0) {
    return () => false;
  }

  return record => checks.every(check => check(record));
}

function createLookupToken15(record: StoredRecord15): string {
  return createHash('sha256')
    .update(`${record.id}:${record.team}:${record.author}:${record.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox15 {
  private records = new Map<number, StoredRecord15>();
  private nextId = 1;

  createRecord(team: string, author: string, body: string): ReviewRecord15 {
    const now = Date.now();
    const normalizedBody = body.trim();
    const record: StoredRecord15 = {
      id: this.nextId++,
      team: normalizeRequired15(team, 'unassigned-team'),
      author: normalizeRequired15(author, 'unknown-author'),
      body: normalizedBody.length > 0 ? normalizedBody : '[empty review body]',
      createdAtMs: now,
      updatedAtMs: now,
      terms: tokenize15(normalizedBody.length > 0 ? normalizedBody : '[empty review body]'),
    };
    this.records.set(record.id, record);
    return snapshot15(record);
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.get(recordId);
    if (!record) return '';
    const url = new URL(`/records/${recordId}`, baseUrl);
    url.hash = createLookupToken15(record);
    return url.toString();
  }

  overwriteMatches(matcher: unknown, nextBody: string): number {
    const replacement = nextBody.trim();
    if (!replacement) return 0;
    const match = createMatcher15(matcher);
    let changed = 0;
    for (const record of this.records.values()) {
      if (!match(record)) continue;
      record.body = replacement;
      record.updatedAtMs = Date.now();
      record.terms = tokenize15(replacement);
      changed++;
    }
    return changed;
  }

  groupByTeam(): Record<string, ReviewRecord15[]> {
    const groups = new Map<string, ReviewRecord15[]>();
    for (const record of this.records.values()) {
      const bucket = groups.get(record.team) ?? [];
      bucket.push(snapshot15(record));
      groups.set(record.team, bucket);
    }
    return Object.fromEntries(groups);
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
      const decoded = decodeInput15(value);
      if (!decoded) continue;
      const record: StoredRecord15 = {
        id: this.nextId++,
        ...decoded,
        terms: tokenize15(decoded.body),
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
        .map(normalizeText15)
        .flatMap(term => [...tokenize15(term)])
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
