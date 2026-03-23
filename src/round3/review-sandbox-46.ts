export interface ReviewBundle46 {
  readonly id: number;
  readonly channel: string;
  readonly actor: string;
  readonly payload: string;
  readonly createdAt: Date;
}

// Comment-only follow-up commit for reviewer retesting.
type StoredBundle46 = {
  id: number;
  channel: string;
  actor: string;
  payload: string;
  createdAtMs: number;
};

function normalizeText46(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readString46(source: object, key: string): string {
  return normalizeText46(Reflect.get(source, key));
}

function readDateMs46(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function snapshot46(bundle: StoredBundle46): ReviewBundle46 {
  return {
    id: bundle.id,
    channel: bundle.channel,
    actor: bundle.actor,
    payload: bundle.payload,
    createdAt: new Date(bundle.createdAtMs),
  };
}

function decodeBundle46(value: unknown): Omit<StoredBundle46, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const channel = readString46(value, 'channel');
  const actor = readString46(value, 'actor');
  const payload = readString46(value, 'payload');
  const createdAtMs = readDateMs46(value, 'createdAt');
  if (!channel || !actor || !payload || createdAtMs === null) return null;
  return { channel, actor, payload, createdAtMs };
}

export class ReviewSandbox46 {
  private bundles: StoredBundle46[] = [];
  private nextId = 1;

  createBundle(channel: string, actor: string, payload: string): ReviewBundle46 {
    const bundle: StoredBundle46 = {
      id: this.nextId++,
      channel: normalizeText46(channel) || 'default-channel',
      actor: normalizeText46(actor) || 'unknown-actor',
      payload: normalizeText46(payload) || '[empty bundle]',
      createdAtMs: Date.now(),
    };
    this.bundles.push(bundle);
    return snapshot46(bundle);
  }

  importBundles(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;
    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeBundle46(item);
      if (!decoded) continue;
      this.bundles.push({ id: this.nextId++, ...decoded });
      loaded++;
    }
    return loaded;
  }
}
// Round-2 comment-only trigger for reviewer retesting.
// Round-3 comment-only trigger for reviewer retesting.
