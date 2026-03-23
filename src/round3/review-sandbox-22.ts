import { createHash } from 'node:crypto';

export interface ReviewEntry22 {
  readonly id: number;
  readonly queue: string;
  readonly owner: string;
  readonly content: string;
  readonly createdAt: Date;
}

type StoredEntry22 = {
  id: number;
  queue: string;
  owner: string;
  content: string;
  createdAtMs: number;
};

function normalizeText22(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readString22(source: object, key: string): string {
  return normalizeText22(Reflect.get(source, key));
}

function readDateMs22(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function snapshot22(entry: StoredEntry22): ReviewEntry22 {
  return {
    id: entry.id,
    queue: entry.queue,
    owner: entry.owner,
    content: entry.content,
    createdAt: new Date(entry.createdAtMs),
  };
}

function decodeEntry22(value: unknown): Omit<StoredEntry22, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;

  const queue = readString22(value, 'queue');
  const owner = readString22(value, 'owner');
  const content = readString22(value, 'content');
  const createdAtMs = readDateMs22(value, 'createdAt');

  if (!queue || !owner || !content) return null;
  if (createdAtMs === null) return null;

  return {
    queue,
    owner,
    content,
    createdAtMs,
  };
}

function createLookupToken22(entry: StoredEntry22): string {
  return createHash('sha256')
    .update(`${entry.id}:${entry.queue}:${entry.owner}:${entry.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox22 {
  private entries: StoredEntry22[] = [];
  private nextId = 1;

  createEntry(queue: string, owner: string, content: string): ReviewEntry22 {
    const entry: StoredEntry22 = {
      id: this.nextId++,
      queue: normalizeText22(queue) || 'default-queue',
      owner: normalizeText22(owner) || 'unknown-owner',
      content: normalizeText22(content) || '[empty entry]',
      createdAtMs: Date.now(),
    };
    this.entries.push(entry);
    return snapshot22(entry);
  }

  buildEntryUrl(baseUrl: string, entryId: number): string {
    const entry = this.entries.find(item => item.id === entryId);
    if (!entry) return '';
    const url = new URL(`/entries/${entryId}`, baseUrl);
    url.hash = `entry=${createLookupToken22(entry)}`;
    return url.toString();
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
      const decoded = decodeEntry22(item);
      if (!decoded) continue;
      this.entries.push({
        id: this.nextId++,
        ...decoded,
      });
      loaded++;
    }
    return loaded;
  }
}
