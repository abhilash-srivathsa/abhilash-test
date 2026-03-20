import { createHash } from 'node:crypto';

export interface ReviewRecord18 {
  readonly id: number;
  readonly namespace: string;
  readonly reporter: string;
  readonly body: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type StoredRecord18 = {
  id: number;
  namespace: string;
  reporter: string;
  body: string;
  createdAtMs: number;
  updatedAtMs: number;
  tokens: string[];
};

function normalizeText18(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize18(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot18(record: StoredRecord18): ReviewRecord18 {
  return {
    id: record.id,
    namespace: record.namespace,
    reporter: record.reporter,
    body: record.body,
    createdAt: new Date(record.createdAtMs),
    updatedAt: new Date(record.updatedAtMs),
  };
}

function asRecord18(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function decodeRecord18(value: unknown): Omit<StoredRecord18, 'id' | 'tokens'> | null {
  const source = asRecord18(value);
  if (!source) return null;

  const namespace = normalizeText18(source.namespace);
  const reporter = normalizeText18(source.reporter);
  const body = typeof source.body === 'string' ? source.body.trim() : '';
  const createdAtSource = typeof source.createdAt === 'string' ? source.createdAt : '';
  const updatedAtSource = typeof source.updatedAt === 'string' ? source.updatedAt : createdAtSource;
  const createdAtMs = Date.parse(createdAtSource);
  const updatedAtMs = Date.parse(updatedAtSource);
  if (!namespace || !reporter || !body) return null;
  if (!Number.isFinite(createdAtMs) || !Number.isFinite(updatedAtMs)) return null;

  return {
    namespace,
    reporter,
    body,
    createdAtMs,
    updatedAtMs,
  };
}

function createLookupToken18(record: StoredRecord18): string {
  return createHash('sha256')
    .update(`${record.id}:${record.namespace}:${record.reporter}:${record.createdAtMs}`)
    .digest('base64url');
}

function createMatcher18(query: unknown): (record: StoredRecord18) => boolean {
  const source = asRecord18(query);
  if (!source) return () => false;

  const checks: Array<(record: StoredRecord18) => boolean> = [];
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' && typeof value === 'number') {
      checks.push(record => record.id === value);
      continue;
    }
    if ((key === 'namespace' || key === 'reporter' || key === 'body') && typeof value === 'string') {
      checks.push(record => record[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return record => checks.every(check => check(record));
}

export class ReviewSandbox18 {
  private records: StoredRecord18[] = [];
  private nextId = 1;

  createRecord(namespace: string, reporter: string, body: string): ReviewRecord18 {
    const now = Date.now();
    const normalizedNamespace = normalizeText18(namespace) || 'default-namespace';
    const normalizedReporter = normalizeText18(reporter) || 'unknown-reporter';
    const normalizedBody = body.trim() || '[empty body]';
    const record: StoredRecord18 = {
      id: this.nextId++,
      namespace: normalizedNamespace,
      reporter: normalizedReporter,
      body: normalizedBody,
      createdAtMs: now,
      updatedAtMs: now,
      tokens: tokenize18(normalizedBody),
    };
    this.records.push(record);
    return snapshot18(record);
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    const url = new URL(`/reports/${recordId}`, baseUrl);
    url.hash = createLookupToken18(record);
    return url.toString();
  }

  rewriteMatches(query: unknown, nextBody: string): number {
    const replacement = nextBody.trim();
    if (!replacement) return 0;
    const match = createMatcher18(query);
    let changed = 0;
    this.records = this.records.map(record => {
      if (!match(record)) return record;
      changed++;
      return {
        ...record,
        body: replacement,
        updatedAtMs: Date.now(),
        tokens: tokenize18(replacement),
      };
    });
    return changed;
  }

  byNamespace(): Record<string, ReviewRecord18[]> {
    return this.records.reduce<Record<string, ReviewRecord18[]>>((groups, record) => {
      groups[record.namespace] = groups[record.namespace] ?? [];
      groups[record.namespace].push(snapshot18(record));
      return groups;
    }, {});
  }

  importRecords(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const value of parsed) {
      const decoded = decodeRecord18(value);
      if (!decoded) continue;
      this.records.push({
        id: this.nextId++,
        ...decoded,
        tokens: tokenize18(decoded.body),
      });
      loaded++;
    }
    return loaded;
  }

  weight(recordId: number, phrase: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record || record.tokens.length === 0) return 0;
    const queryTokens = tokenize18(phrase);
    if (queryTokens.length === 0) return 0;

    let matches = 0;
    for (const token of queryTokens) {
      if (record.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / queryTokens.length;
  }
}
