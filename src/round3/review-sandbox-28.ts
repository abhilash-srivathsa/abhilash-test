export interface ReviewFragment28 {
  readonly id: number;
  readonly channel: string;
  readonly owner: string;
  readonly body: string;
  readonly createdAt: Date;
}

type StoredFragment28 = {
  id: number;
  channel: string;
  owner: string;
  body: string;
  createdAtMs: number;
};

function normalizeText28(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot28(fragment: StoredFragment28): ReviewFragment28 {
  return {
    id: fragment.id,
    channel: fragment.channel,
    owner: fragment.owner,
    body: fragment.body,
    createdAt: new Date(fragment.createdAtMs),
  };
}

function readString28(source: object, key: string): string {
  return normalizeText28(Reflect.get(source, key));
}

function readDateMs28(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function decodeFragment28(value: unknown): Omit<StoredFragment28, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;

  const channel = readString28(value, 'channel');
  const owner = readString28(value, 'owner');
  const body = readString28(value, 'body');
  const createdAtMs = readDateMs28(value, 'createdAt');

  if (!channel || !owner || !body) return null;
  if (createdAtMs === null) return null;

  return {
    channel,
    owner,
    body,
    createdAtMs,
  };
}

export class ReviewSandbox28 {
  private fragments: StoredFragment28[] = [];
  private nextId = 1;

  createFragment(channel: string, owner: string, body: string): ReviewFragment28 {
    const fragment: StoredFragment28 = {
      id: this.nextId++,
      channel: normalizeText28(channel) || 'default-channel',
      owner: normalizeText28(owner) || 'unknown-owner',
      body: normalizeText28(body) || '[empty fragment]',
      createdAtMs: Date.now(),
    };
    this.fragments.push(fragment);
    return snapshot28(fragment);
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
      const decoded = decodeFragment28(item);
      if (!decoded) continue;
      this.fragments.push({
        id: this.nextId++,
        ...decoded,
      });
      loaded++;
    }
    return loaded;
  }

  collectByChannel(): Record<string, ReviewFragment28[]> {
    const groups = new Map<string, ReviewFragment28[]>();
    for (const fragment of this.fragments) {
      const items = groups.get(fragment.channel) ?? [];
      items.push(snapshot28(fragment));
      groups.set(fragment.channel, items);
    }
    return Object.fromEntries(groups);
  }
}
