export interface ReviewPacket20E {
  readonly id: number;
  readonly queue: string;
  readonly actor: string;
  readonly payload: string;
  readonly createdAt: Date;
}

type StoredPacket20E = {
  id: number;
  queue: string;
  actor: string;
  payload: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText20E(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize20E(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot20E(packet: StoredPacket20E): ReviewPacket20E {
  return {
    id: packet.id,
    queue: packet.queue,
    actor: packet.actor,
    payload: packet.payload,
    createdAt: new Date(packet.createdAtMs),
  };
}

function asDictionary20E(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function decodePacket20E(value: unknown): Omit<StoredPacket20E, 'id' | 'tokens'> | null {
  const source = asDictionary20E(value);
  if (!source) return null;

  const queue = normalizeText20E(source.queue);
  const actor = normalizeText20E(source.actor);
  const payload = normalizeText20E(source.payload);
  const createdAtText = typeof source.createdAt === 'string' ? source.createdAt : '';
  const createdAtMs = Date.parse(createdAtText);

  if (!queue || !actor || !payload) return null;
  if (!Number.isFinite(createdAtMs)) return null;

  return {
    queue,
    actor,
    payload,
    createdAtMs,
  };
}

export class ReviewSandbox20E {
  private packets: StoredPacket20E[] = [];
  private nextId = 1;

  createPacket(queue: string, actor: string, payload: string): ReviewPacket20E {
    const normalizedPayload = normalizeText20E(payload) || '[empty payload]';
    const packet: StoredPacket20E = {
      id: this.nextId++,
      queue: normalizeText20E(queue) || 'default-queue',
      actor: normalizeText20E(actor) || 'unknown-actor',
      payload: normalizedPayload,
      createdAtMs: Date.now(),
      tokens: tokenize20E(normalizedPayload),
    };
    this.packets.push(packet);
    return snapshot20E(packet);
  }

  importPackets(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodePacket20E(item);
      if (!decoded) continue;
      this.packets.push({
        id: this.nextId++,
        ...decoded,
        tokens: tokenize20E(decoded.payload),
      });
      loaded++;
    }
    return loaded;
  }

  payloadScore(packetId: number, phrase: string): number {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return 0;
    const tokens = tokenize20E(phrase);
    if (tokens.length === 0 || packet.tokens.length === 0) return 0;

    let matches = 0;
    for (const token of tokens) {
      if (packet.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
