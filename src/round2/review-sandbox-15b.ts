import { createHash } from 'node:crypto';

export type ReviewSnapshot15B = Readonly<{
  id: number;
  source: string;
  category: string;
  payload: string;
  createdAt: Date;
}>;

type StoredSnapshot15B = {
  id: number;
  source: string;
  category: string;
  payload: string;
  createdAtMs: number;
  tokens: string[];
};

type SnapshotInput15B = {
  source: string;
  category: string;
  payload: string;
  createdAt: string;
};

function snapshot15B(value: StoredSnapshot15B): ReviewSnapshot15B {
  return {
    id: value.id,
    source: value.source,
    category: value.category,
    payload: value.payload,
    createdAt: new Date(value.createdAtMs),
  };
}

function tokenize15B(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function asSnapshotInput15B(value: unknown): SnapshotInput15B | null {
  if (typeof value !== 'object' || value === null) return null;
  const source = value as Record<string, unknown>;
  if (
    typeof source.source !== 'string' ||
    typeof source.category !== 'string' ||
    typeof source.payload !== 'string' ||
    typeof source.createdAt !== 'string'
  ) {
    return null;
  }
  return {
    source: source.source,
    category: source.category,
    payload: source.payload,
    createdAt: source.createdAt,
  };
}

function createExportToken15B(snapshot: StoredSnapshot15B): string {
  return createHash('sha256')
    .update(`${snapshot.id}:${snapshot.source}:${snapshot.category}:${snapshot.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox15B {
  private snapshots: StoredSnapshot15B[] = [];
  private cursor = 1;

  ingest(source: string, category: string, payload: string): ReviewSnapshot15B {
    const createdAtMs = Date.now();
    const snapshot: StoredSnapshot15B = {
      id: this.cursor++,
      source: source.trim() || 'unknown-source',
      category: category.trim() || 'uncategorized',
      payload: payload.trim() || '[empty payload]',
      createdAtMs,
      tokens: tokenize15B(payload.trim() || '[empty payload]'),
    };
    this.snapshots.push(snapshot);
    return snapshot15B(snapshot);
  }

  buildExportUrl(baseUrl: string, id: number): string {
    const snapshot = this.snapshots.find(item => item.id === id);
    if (!snapshot) return '';
    const url = new URL(`/exports/${id}`, baseUrl);
    url.hash = createExportToken15B(snapshot);
    return url.toString();
  }

  replaceWhere(query: Record<string, unknown>, nextPayload: string): number {
    const replacement = nextPayload.trim();
    if (!replacement) return 0;
    const entries = Object.entries(query).filter(([, value]) => value !== undefined);
    if (entries.length === 0) return 0;

    let changed = 0;
    for (const snapshot of this.snapshots) {
      const matches = entries.every(([key, value]) => {
        if (key !== 'id' && key !== 'source' && key !== 'category' && key !== 'payload') {
          return false;
        }
        return (snapshot as Record<string, unknown>)[key] === value;
      });
      if (!matches) continue;
      snapshot.payload = replacement;
      snapshot.tokens = tokenize15B(replacement);
      changed++;
    }
    return changed;
  }

  collectByCategory(): Record<string, ReviewSnapshot15B[]> {
    const buckets: Record<string, ReviewSnapshot15B[]> = {};
    for (const snapshot of this.snapshots) {
      buckets[snapshot.category] = buckets[snapshot.category] ?? [];
      buckets[snapshot.category].push(snapshot15B(snapshot));
    }
    return buckets;
  }

  loadSnapshots(json: string): number {
    let items: unknown;
    try {
      items = JSON.parse(json);
    } catch {
      return 0;
    }
    if (!Array.isArray(items)) return 0;

    let count = 0;
    for (const item of items) {
      const input = asSnapshotInput15B(item);
      if (!input) continue;
      const createdAtMs = Date.parse(input.createdAt);
      if (!Number.isFinite(createdAtMs)) continue;
      const payload = input.payload.trim() || '[empty payload]';
      this.snapshots.push({
        id: this.cursor++,
        source: input.source.trim() || 'unknown-source',
        category: input.category.trim() || 'uncategorized',
        payload,
        createdAtMs,
        tokens: tokenize15B(payload),
      });
      count++;
    }
    return count;
  }

  scorePayload(id: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === id);
    if (!snapshot || snapshot.tokens.length === 0) return 0;
    const queryTokens = tokenize15B(phrase);
    if (queryTokens.length === 0) return 0;

    let matches = 0;
    for (const token of queryTokens) {
      if (snapshot.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / queryTokens.length;
  }
}
