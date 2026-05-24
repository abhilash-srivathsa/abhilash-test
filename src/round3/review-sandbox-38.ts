export interface ReviewFragment38 {
  readonly id: number;
  readonly channel: string;
  readonly owner: string;
  readonly body: string;
  readonly createdAt: Date;
}

type StoredFragment38 = {
  id: number;
  channel: string;
  owner: string;
  body: string;
  createdAtMs: number;
};

function normalizeText38(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot38(fragment: StoredFragment38): ReviewFragment38 {
  return {
    id: fragment.id,
    channel: fragment.channel,
    owner: fragment.owner,
    body: fragment.body,
    createdAt: new Date(fragment.createdAtMs),
  };
}

function readString38(source: object, key: string): string {
  return normalizeText38(Reflect.get(source, key));
}

function readDateMs38(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function decodeFragment38(value: unknown): Omit<StoredFragment38, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const channel = readString38(value, 'channel');
  const owner = readString38(value, 'owner');
  const body = readString38(value, 'body');
  const createdAtMs = readDateMs38(value, 'createdAt');
  if (!channel || !owner || !body || createdAtMs === null) return null;
  return { channel, owner, body, createdAtMs };
}

export class ReviewSandbox38 {
  private fragments: StoredFragment38[] = [];
  private nextId = 1;

  createFragment(channel: string, owner: string, body: string): ReviewFragment38 {
    const fragment: StoredFragment38 = {
      id: this.nextId++,
      channel: normalizeText38(channel) || 'default-channel',
      owner: normalizeText38(owner) || 'unknown-owner',
      body: normalizeText38(body) || '[empty fragment]',
      createdAtMs: Date.now(),
    };
    this.fragments.push(fragment);
    return snapshot38(fragment);
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
      const decoded = decodeFragment38(item);
      if (!decoded) continue;
      this.fragments.push({ id: this.nextId++, ...decoded });
      loaded++;
    }
    return loaded;
  }
}
