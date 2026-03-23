import { createHash } from 'node:crypto';

export interface ReviewEntry21 {
  readonly id: number;
  readonly area: string;
  readonly reporter: string;
  readonly content: string;
  readonly createdAt: Date;
}

type StoredEntry21 = {
  id: number;
  area: string;
  reporter: string;
  content: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText21(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize21(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot21(entry: StoredEntry21): ReviewEntry21 {
  return {
    id: entry.id,
    area: entry.area,
    reporter: entry.reporter,
    content: entry.content,
    createdAt: new Date(entry.createdAtMs),
  };
}

function asDictionary21(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function decodeEntry21(value: unknown): Omit<StoredEntry21, 'id' | 'tokens'> | null {
  const source = asDictionary21(value);
  if (!source) return null;

  const area = normalizeText21(source.area);
  const reporter = normalizeText21(source.reporter);
  const content = normalizeText21(source.content);
  const createdAtText = typeof source.createdAt === 'string' ? source.createdAt : '';
  const createdAtMs = Date.parse(createdAtText);

  if (!area || !reporter || !content) return null;
  if (!Number.isFinite(createdAtMs)) return null;

  return {
    area,
    reporter,
    content,
    createdAtMs,
  };
}

function createMatcher21(query: unknown): (entry: StoredEntry21) => boolean {
  const source = asDictionary21(query);
  if (!source) return () => false;

  const checks: Array<(entry: StoredEntry21) => boolean> = [];
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' && typeof value === 'number') {
      checks.push(entry => entry.id === value);
      continue;
    }
    if ((key === 'area' || key === 'reporter' || key === 'content') && typeof value === 'string') {
      checks.push(entry => entry[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return entry => checks.every(check => check(entry));
}

function createLookupToken21(entry: StoredEntry21): string {
  return createHash('sha256')
    .update(`${entry.id}:${entry.area}:${entry.reporter}:${entry.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox21 {
  private entries: StoredEntry21[] = [];
  private nextId = 1;

  createEntry(area: string, reporter: string, content: string): ReviewEntry21 {
    const normalizedContent = normalizeText21(content) || '[empty entry]';
    const entry: StoredEntry21 = {
      id: this.nextId++,
      area: normalizeText21(area) || 'general',
      reporter: normalizeText21(reporter) || 'unknown-reporter',
      content: normalizedContent,
      createdAtMs: Date.now(),
      tokens: tokenize21(normalizedContent),
    };
    this.entries.push(entry);
    return snapshot21(entry);
  }

  buildEntryUrl(baseUrl: string, entryId: number): string {
    const entry = this.entries.find(item => item.id === entryId);
    if (!entry) return '';
    const url = new URL(`/entries/${entryId}`, baseUrl);
    url.hash = `entry=${createLookupToken21(entry)}`;
    return url.toString();
  }

  replaceEntries(query: unknown, nextContent: string): number {
    const replacement = normalizeText21(nextContent);
    if (!replacement) return 0;

    const matches = createMatcher21(query);
    let changed = 0;
    this.entries = this.entries.map(entry => {
      if (!matches(entry)) return entry;
      changed++;
      return {
        ...entry,
        content: replacement,
        tokens: tokenize21(replacement),
      };
    });
    return changed;
  }

  importEntries(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeEntry21(item);
      if (!decoded) continue;
      this.entries.push({
        id: this.nextId++,
        ...decoded,
        tokens: tokenize21(decoded.content),
      });
      loaded++;
    }
    return loaded;
  }

  contentScore(entryId: number, phrase: string): number {
    const entry = this.entries.find(item => item.id === entryId);
    if (!entry) return 0;

    const tokens = tokenize21(phrase);
    if (tokens.length === 0 || entry.tokens.length === 0) return 0;

    let matches = 0;
    for (const token of tokens) {
      if (entry.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
