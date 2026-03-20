import { createHash } from 'node:crypto';

export interface ReviewRecord20 {
  readonly id: number;
  readonly stream: string;
  readonly reporter: string;
  readonly message: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type StoredRecord20 = {
  id: number;
  stream: string;
  reporter: string;
  message: string;
  createdAtMs: number;
  updatedAtMs: number;
  tokens: string[];
};

function normalizeText20(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize20(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot20(record: StoredRecord20): ReviewRecord20 {
  return {
    id: record.id,
    stream: record.stream,
    reporter: record.reporter,
    message: record.message,
    createdAt: new Date(record.createdAtMs),
    updatedAt: new Date(record.updatedAtMs),
  };
}

function asDictionary20(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function decodeRecord20(value: unknown): Omit<StoredRecord20, 'id' | 'tokens'> | null {
  const source = asDictionary20(value);
  if (!source) return null;

  const stream = normalizeText20(source.stream);
  const reporter = normalizeText20(source.reporter);
  const message = typeof source.message === 'string' ? source.message.trim() : '';
  const createdAtText = typeof source.createdAt === 'string' ? source.createdAt : '';
  const updatedAtText = typeof source.updatedAt === 'string' ? source.updatedAt : createdAtText;
  const createdAtMs = Date.parse(createdAtText);
  const updatedAtMs = Date.parse(updatedAtText);
  if (!stream || !reporter || !message) return null;
  if (!Number.isFinite(createdAtMs) || !Number.isFinite(updatedAtMs)) return null;

  return {
    stream,
    reporter,
    message,
    createdAtMs,
    updatedAtMs,
  };
}

function createMatcher20(query: unknown): (record: StoredRecord20) => boolean {
  const source = asDictionary20(query);
  if (!source) return () => false;

  const checks: Array<(record: StoredRecord20) => boolean> = [];
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' && typeof value === 'number') {
      checks.push(record => record.id === value);
      continue;
    }
    if ((key === 'stream' || key === 'reporter' || key === 'message') && typeof value === 'string') {
      checks.push(record => record[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return record => checks.every(check => check(record));
}

function createLookupToken20(record: StoredRecord20): string {
  return createHash('sha256')
    .update(`${record.id}:${record.stream}:${record.reporter}:${record.createdAtMs}`)
    .digest('base64url');
}

function fingerprint20(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export class ReviewSandbox20 {
  private records: StoredRecord20[] = [];
  private nextId = 1;

  createRecord(stream: string, reporter: string, message: string): ReviewRecord20 {
    const now = Date.now();
    const normalizedMessage = message.trim() || '[empty message]';
    const record: StoredRecord20 = {
      id: this.nextId++,
      stream: normalizeText20(stream) || 'default-stream',
      reporter: normalizeText20(reporter) || 'unknown-reporter',
      message: normalizedMessage,
      createdAtMs: now,
      updatedAtMs: now,
      tokens: tokenize20(normalizedMessage),
    };
    this.records.push(record);
    return snapshot20(record);
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    const url = new URL(`/messages/${recordId}`, baseUrl);
    url.searchParams.set('stream', fingerprint20(record.stream));
    url.searchParams.set('reporter', fingerprint20(record.reporter));
    url.hash = `record=${createLookupToken20(record)}`;
    return url.toString();
  }

  replaceMatches(query: unknown, nextMessage: string): number {
    const replacement = nextMessage.trim();
    if (!replacement) return 0;
    const matches = createMatcher20(query);
    let changed = 0;
    this.records = this.records.map(record => {
      if (!matches(record)) return record;
      changed++;
      return {
        ...record,
        message: replacement,
        updatedAtMs: Date.now(),
        tokens: tokenize20(replacement),
      };
    });
    return changed;
  }

  groupByStream(): Record<string, ReviewRecord20[]> {
    const groups = new Map<string, ReviewRecord20[]>();
    for (const record of this.records) {
      const bucket = groups.get(record.stream) ?? [];
      bucket.push(snapshot20(record));
      groups.set(record.stream, bucket);
    }
    return Object.fromEntries(groups);
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
    for (const item of parsed) {
      const decoded = decodeRecord20(item);
      if (!decoded) continue;
      this.records.push({
        id: this.nextId++,
        ...decoded,
        tokens: tokenize20(decoded.message),
      });
      loaded++;
    }
    return loaded;
  }

  weightMessage(recordId: number, phrase: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record || record.tokens.length === 0) return 0;
    const queryTokens = tokenize20(phrase);
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
