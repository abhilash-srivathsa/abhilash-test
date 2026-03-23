export interface ReviewFragment48 {
  readonly id: number;
  readonly channel: string;
  readonly owner: string;
  readonly body: string;
  readonly createdAt: Date;
}

// Comment-only follow-up commit for reviewer retesting.
type StoredFragment48 = {
  id: number;
  channel: string;
  owner: string;
  body: string;
  createdAtMs: number;
};

function normalizeText48(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readString48(source: object, key: string): string {
  return normalizeText48(Reflect.get(source, key));
}

function readDateMs48(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function snapshot48(fragment: StoredFragment48): ReviewFragment48 {
  return {
    id: fragment.id,
    channel: fragment.channel,
    owner: fragment.owner,
    body: fragment.body,
    createdAt: new Date(fragment.createdAtMs),
  };
}

function decodeFragment48(value: unknown): Omit<StoredFragment48, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const channel = readString48(value, 'channel');
  const owner = readString48(value, 'owner');
  const body = readString48(value, 'body');
  const createdAtMs = readDateMs48(value, 'createdAt');
  if (!channel || !owner || !body || createdAtMs === null) return null;
  return { channel, owner, body, createdAtMs };
}

export class ReviewSandbox48 {
  private fragments: StoredFragment48[] = [];
  private nextId = 1;

  createFragment(channel: string, owner: string, body: string): ReviewFragment48 {
    const fragment: StoredFragment48 = {
      id: this.nextId++,
      channel: normalizeText48(channel) || 'default-channel',
      owner: normalizeText48(owner) || 'unknown-owner',
      body: normalizeText48(body) || '[empty fragment]',
      createdAtMs: Date.now(),
    };
    this.fragments.push(fragment);
    return snapshot48(fragment);
  }

  importFragments(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;
    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeFragment48(item);
      if (!decoded) continue;
      this.fragments.push({ id: this.nextId++, ...decoded });
      loaded++;
    }
    return loaded;
  }
}
// Round-2 comment-only trigger for reviewer retesting.
