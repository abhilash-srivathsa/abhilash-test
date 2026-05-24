export interface ReviewBundle36 {
  readonly id: number;
  readonly channel: string;
  readonly actor: string;
  readonly payload: string;
  readonly createdAt: Date;
}

type StoredBundle36 = {
  id: number;
  channel: string;
  actor: string;
  payload: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText36(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize36(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot36(bundle: StoredBundle36): ReviewBundle36 {
  return {
    id: bundle.id,
    channel: bundle.channel,
    actor: bundle.actor,
    payload: bundle.payload,
    createdAt: new Date(bundle.createdAtMs),
  };
}

function readString36(source: object, key: string): string {
  return normalizeText36(Reflect.get(source, key));
}

function readDateMs36(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function decodeBundle36(value: unknown): Omit<StoredBundle36, 'id' | 'tokens'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const channel = readString36(value, 'channel');
  const actor = readString36(value, 'actor');
  const payload = readString36(value, 'payload');
  const createdAtMs = readDateMs36(value, 'createdAt');
  if (!channel || !actor || !payload || createdAtMs === null) return null;
  return { channel, actor, payload, createdAtMs };
}

export class ReviewSandbox36 {
  private bundles: StoredBundle36[] = [];
  private nextId = 1;

  createBundle(channel: string, actor: string, payload: string): ReviewBundle36 {
    const normalizedPayload = normalizeText36(payload) || '[empty bundle]';
    const bundle: StoredBundle36 = {
      id: this.nextId++,
      channel: normalizeText36(channel) || 'default-channel',
      actor: normalizeText36(actor) || 'unknown-actor',
      payload: normalizedPayload,
      createdAtMs: Date.now(),
      tokens: tokenize36(normalizedPayload),
    };
    this.bundles.push(bundle);
    return snapshot36(bundle);
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
      const decoded = decodeBundle36(item);
      if (!decoded) continue;
      this.bundles.push({ id: this.nextId++, ...decoded, tokens: tokenize36(decoded.payload) });
      loaded++;
    }
    return loaded;
  }

  payloadScore(bundleId: number, phrase: string): number {
    const bundle = this.bundles.find(item => item.id === bundleId);
    if (!bundle) return 0;
    const tokens = tokenize36(phrase);
    if (tokens.length === 0 || bundle.tokens.length === 0) return 0;
    let matches = 0;
    for (const token of tokens) {
      if (bundle.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
