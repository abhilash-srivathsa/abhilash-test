export interface ReviewRecord26 {
  readonly id: number;
  readonly lane: string;
  readonly actor: string;
  readonly payload: string;
  readonly createdAt: Date;
}

type StoredRecord26 = {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText26(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize26(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot26(record: StoredRecord26): ReviewRecord26 {
  return {
    id: record.id,
    lane: record.lane,
    actor: record.actor,
    payload: record.payload,
    createdAt: new Date(record.createdAtMs),
  };
}

function readString26(source: object, key: string): string {
  return normalizeText26(Reflect.get(source, key));
}

function readDateMs26(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function decodeRecord26(value: unknown): Omit<StoredRecord26, 'id' | 'tokens'> | null {
  if (typeof value !== 'object' || value === null) return null;

  const lane = readString26(value, 'lane');
  const actor = readString26(value, 'actor');
  const payload = readString26(value, 'payload');
  const createdAtMs = readDateMs26(value, 'createdAt');

  if (!lane || !actor || !payload) return null;
  if (createdAtMs === null) return null;

  return {
    lane,
    actor,
    payload,
    createdAtMs,
  };
}

export class ReviewSandbox26 {
  private records: StoredRecord26[] = [];
  private nextId = 1;

  createRecord(lane: string, actor: string, payload: string): ReviewRecord26 {
    const normalizedPayload = normalizeText26(payload) || '[empty payload]';
    const record: StoredRecord26 = {
      id: this.nextId++,
      lane: normalizeText26(lane) || 'default-lane',
      actor: normalizeText26(actor) || 'unknown-actor',
      payload: normalizedPayload,
      createdAtMs: Date.now(),
      tokens: tokenize26(normalizedPayload),
    };
    this.records.push(record);
    return snapshot26(record);
  }

  importRecords(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeRecord26(item);
      if (!decoded) continue;
      this.records.push({
        id: this.nextId++,
        ...decoded,
        tokens: tokenize26(decoded.payload),
      });
      loaded++;
    }
    return loaded;
  }

  payloadScore(recordId: number, phrase: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return 0;

    const tokens = tokenize26(phrase);
    if (tokens.length === 0 || record.tokens.length === 0) return 0;

    let matches = 0;
    for (const token of tokens) {
      if (record.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
