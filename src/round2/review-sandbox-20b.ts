import { createHash } from 'node:crypto';

export type ReviewSnapshot20B = Readonly<{
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAt: Date;
}>;

type StoredSnapshot20B = {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText20B(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize20B(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot20B(value: StoredSnapshot20B): ReviewSnapshot20B {
  return {
    id: value.id,
    lane: value.lane,
    actor: value.actor,
    payload: value.payload,
    createdAt: new Date(value.createdAtMs),
  };
}

function asDictionary20B(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function createMatcher20B(query: unknown): (snapshot: StoredSnapshot20B) => boolean {
  const source = asDictionary20B(query);
  if (!source) return () => false;

  const checks: Array<(snapshot: StoredSnapshot20B) => boolean> = [];
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' && typeof value === 'number') {
      checks.push(snapshot => snapshot.id === value);
      continue;
    }
    if ((key === 'lane' || key === 'actor' || key === 'payload') && typeof value === 'string') {
      checks.push(snapshot => snapshot[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return snapshot => checks.every(check => check(snapshot));
}

function decodeSnapshot20B(value: unknown): Omit<StoredSnapshot20B, 'id' | 'tokens'> | null {
  const source = asDictionary20B(value);
  if (!source) return null;

  const lane = normalizeText20B(source.lane);
  const actor = normalizeText20B(source.actor);
  const payload = typeof source.payload === 'string' ? source.payload.trim() : '';
  const createdAtText = typeof source.createdAt === 'string' ? source.createdAt : '';
  const createdAtMs = Date.parse(createdAtText);
  if (!lane || !actor || !payload) return null;
  if (!Number.isFinite(createdAtMs)) return null;

  return {
    lane,
    actor,
    payload,
    createdAtMs,
  };
}

function createShareToken20B(snapshot: StoredSnapshot20B): string {
  return createHash('sha256')
    .update(`${snapshot.id}:${snapshot.lane}:${snapshot.actor}:${snapshot.createdAtMs}`)
    .digest('base64url');
}

function fingerprint20B(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export class ReviewSandbox20B {
  private snapshots: StoredSnapshot20B[] = [];
  private nextId = 1;

  createSnapshot(lane: string, actor: string, payload: string): ReviewSnapshot20B {
    const normalizedPayload = payload.trim() || '[empty payload]';
    const snapshot: StoredSnapshot20B = {
      id: this.nextId++,
      lane: normalizeText20B(lane) || 'default-lane',
      actor: normalizeText20B(actor) || 'unknown-actor',
      payload: normalizedPayload,
      createdAtMs: Date.now(),
      tokens: tokenize20B(normalizedPayload),
    };
    this.snapshots.push(snapshot);
    return snapshot20B(snapshot);
  }

  buildShareUrl(baseUrl: string, snapshotId: number): string {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return '';
    const url = new URL(`/shares/${snapshotId}`, baseUrl);
    url.searchParams.set('lane', fingerprint20B(snapshot.lane));
    url.searchParams.set('actor', fingerprint20B(snapshot.actor));
    url.hash = `share=${createShareToken20B(snapshot)}`;
    return url.toString();
  }

  patchSnapshots(query: unknown, nextPayload: string): number {
    const replacement = nextPayload.trim();
    if (!replacement) return 0;
    const matches = createMatcher20B(query);
    let changed = 0;
    this.snapshots = this.snapshots.map(snapshot => {
      if (!matches(snapshot)) return snapshot;
      changed++;
      return {
        ...snapshot,
        payload: replacement,
        tokens: tokenize20B(replacement),
      };
    });
    return changed;
  }

  collectByLane(): Record<string, ReviewSnapshot20B[]> {
    const buckets = new Map<string, ReviewSnapshot20B[]>();
    for (const snapshot of this.snapshots) {
      const items = buckets.get(snapshot.lane) ?? [];
      items.push(snapshot20B(snapshot));
      buckets.set(snapshot.lane, items);
    }
    return Object.fromEntries(buckets);
  }

  importSnapshots(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeSnapshot20B(item);
      if (!decoded) continue;
      this.snapshots.push({
        id: this.nextId++,
        ...decoded,
        tokens: tokenize20B(decoded.payload),
      });
      loaded++;
    }
    return loaded;
  }

  payloadWeight(snapshotId: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot || snapshot.payload.length === 0) return 0;
    const tokens = tokenize20B(phrase);
    if (tokens.length === 0) return 0;

    let matches = 0;
    for (const token of tokens) {
      if (snapshot.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
