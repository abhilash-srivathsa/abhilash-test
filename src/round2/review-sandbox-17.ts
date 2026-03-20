import { createHash } from 'node:crypto';

export interface ReviewRecord17 {
  readonly id: number;
  readonly workspace: string;
  readonly owner: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

type StoredRecord17 = {
  id: number;
  workspace: string;
  owner: string;
  content: string;
  createdAtMs: number;
  updatedAtMs: number;
  tokens: string[];
};

function normalizeText17(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize17(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot17(record: StoredRecord17): ReviewRecord17 {
  return {
    id: record.id,
    workspace: record.workspace,
    owner: record.owner,
    content: record.content,
    createdAt: new Date(record.createdAtMs),
    updatedAt: new Date(record.updatedAtMs),
  };
}

function asDictionary17(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function createMatcher17(query: unknown): (record: StoredRecord17) => boolean {
  const source = asDictionary17(query);
  if (!source) return () => false;

  const checks: Array<(record: StoredRecord17) => boolean> = [];
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' && typeof value === 'number') {
      checks.push(record => record.id === value);
      continue;
    }
    if ((key === 'workspace' || key === 'owner' || key === 'content') && typeof value === 'string') {
      checks.push(record => record[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return record => checks.every(check => check(record));
}

function createLookupToken17(record: StoredRecord17): string {
  return createHash('sha256')
    .update(`${record.id}:${record.workspace}:${record.owner}:${record.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox17 {
  private records: StoredRecord17[] = [];
  private nextId = 1;

  createRecord(workspace: string, owner: string, content: string): ReviewRecord17 {
    const now = Date.now();
    const normalizedContent = content.trim() || '[empty content]';
    const record: StoredRecord17 = {
      id: this.nextId++,
      workspace: normalizeText17(workspace) || 'default-workspace',
      owner: normalizeText17(owner) || 'unknown-owner',
      content: normalizedContent,
      createdAtMs: now,
      updatedAtMs: now,
      tokens: tokenize17(normalizedContent),
    };
    this.records.push(record);
    return snapshot17(record);
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    const url = new URL(`/items/${recordId}`, baseUrl);
    url.hash = createLookupToken17(record);
    return url.toString();
  }

  updateWhere(query: unknown, nextContent: string): number {
    const replacement = nextContent.trim();
    if (!replacement) return 0;
    const matches = createMatcher17(query);
    let changed = 0;
    this.records = this.records.map(record => {
      if (!matches(record)) return record;
      changed++;
      return {
        ...record,
        content: replacement,
        updatedAtMs: Date.now(),
        tokens: tokenize17(replacement),
      };
    });
    return changed;
  }

  groupByWorkspace(): Record<string, ReviewRecord17[]> {
    const groups = new Map<string, ReviewRecord17[]>();
    for (const record of this.records) {
      const bucket = groups.get(record.workspace) ?? [];
      bucket.push(snapshot17(record));
      groups.set(record.workspace, bucket);
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
    for (const item of parsed) {
      const source = asDictionary17(item);
      if (!source) continue;
      const workspace = normalizeText17(source.workspace);
      const owner = normalizeText17(source.owner);
      const content = typeof source.content === 'string' ? source.content.trim() : '';
      const createdAtText = typeof source.createdAt === 'string' ? source.createdAt : '';
      const updatedAtText = typeof source.updatedAt === 'string' ? source.updatedAt : createdAtText;
      const createdAtMs = Date.parse(createdAtText);
      const updatedAtMs = Date.parse(updatedAtText);
      if (!workspace || !owner || !content) continue;
      if (!Number.isFinite(createdAtMs) || !Number.isFinite(updatedAtMs)) continue;
      this.records.push({
        id: this.nextId++,
        workspace,
        owner,
        content,
        createdAtMs,
        updatedAtMs,
        tokens: tokenize17(content),
      });
      loaded++;
    }
    return loaded;
  }

  scoreContent(recordId: number, terms: string[]): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record || record.tokens.length === 0) return 0;
    const queryTokens = terms.flatMap(tokenize17);
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
