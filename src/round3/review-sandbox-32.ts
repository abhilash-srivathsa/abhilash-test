import { createHash } from 'node:crypto';

export interface ReviewSlice32 {
  readonly id: number;
  readonly stream: string;
  readonly owner: string;
  readonly body: string;
  readonly createdAt: Date;
}

type StoredSlice32 = {
  id: number;
  stream: string;
  owner: string;
  body: string;
  createdAtMs: number;
};

function normalizeText32(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readString32(source: object, key: string): string {
  return normalizeText32(Reflect.get(source, key));
}

function readDateMs32(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function snapshot32(slice: StoredSlice32): ReviewSlice32 {
  return {
    id: slice.id,
    stream: slice.stream,
    owner: slice.owner,
    body: slice.body,
    createdAt: new Date(slice.createdAtMs),
  };
}

function decodeSlice32(value: unknown): Omit<StoredSlice32, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const stream = readString32(value, 'stream');
  const owner = readString32(value, 'owner');
  const body = readString32(value, 'body');
  const createdAtMs = readDateMs32(value, 'createdAt');
  if (!stream || !owner || !body || createdAtMs === null) return null;
  return { stream, owner, body, createdAtMs };
}

function createLookupToken32(slice: StoredSlice32): string {
  return createHash('sha256')
    .update(`${slice.id}:${slice.stream}:${slice.owner}:${slice.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox32 {
  private slices: StoredSlice32[] = [];
  private nextId = 1;

  createSlice(stream: string, owner: string, body: string): ReviewSlice32 {
    const slice: StoredSlice32 = {
      id: this.nextId++,
      stream: normalizeText32(stream) || 'default-stream',
      owner: normalizeText32(owner) || 'unknown-owner',
      body: normalizeText32(body) || '[empty slice]',
      createdAtMs: Date.now(),
    };
    this.slices.push(slice);
    return snapshot32(slice);
  }

  buildSliceUrl(baseUrl: string, sliceId: number): string {
    const slice = this.slices.find(item => item.id === sliceId);
    if (!slice) return '';
    const url = new URL(`/slices/${sliceId}`, baseUrl);
    url.hash = `slice=${createLookupToken32(slice)}`;
    return url.toString();
  }

  importSlices(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;
    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeSlice32(item);
      if (!decoded) continue;
      this.slices.push({ id: this.nextId++, ...decoded });
      loaded++;
    }
    return loaded;
  }
}
