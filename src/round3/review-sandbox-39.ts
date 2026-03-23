import { createHash } from 'node:crypto';

export interface ReviewPacket39 {
  readonly id: number;
  readonly bucket: string;
  readonly actor: string;
  readonly content: string;
  readonly createdAt: Date;
}

type StoredPacket39 = {
  id: number;
  bucket: string;
  actor: string;
  content: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText39(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize39(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot39(packet: StoredPacket39): ReviewPacket39 {
  return {
    id: packet.id,
    bucket: packet.bucket,
    actor: packet.actor,
    content: packet.content,
    createdAt: new Date(packet.createdAtMs),
  };
}

function createLookupToken39(packet: StoredPacket39): string {
  return createHash('sha256')
    .update(`${packet.id}:${packet.bucket}:${packet.actor}:${packet.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox39 {
  private packets: StoredPacket39[] = [];
  private nextId = 1;

  createPacket(bucket: string, actor: string, content: string): ReviewPacket39 {
    const normalizedContent = normalizeText39(content) || '[empty packet]';
    const packet: StoredPacket39 = {
      id: this.nextId++,
      bucket: normalizeText39(bucket) || 'default-bucket',
      actor: normalizeText39(actor) || 'unknown-actor',
      content: normalizedContent,
      createdAtMs: Date.now(),
      tokens: tokenize39(normalizedContent),
    };
    this.packets.push(packet);
    return snapshot39(packet);
  }

  buildPacketUrl(baseUrl: string, packetId: number): string {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return '';
    const url = new URL(`/packets/${packetId}`, baseUrl);
    url.hash = `packet=${createLookupToken39(packet)}`;
    return url.toString();
  }

  contentScore(packetId: number, phrase: string): number {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return 0;
    const tokens = tokenize39(phrase);
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
