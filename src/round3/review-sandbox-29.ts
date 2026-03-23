import { createHash } from 'node:crypto';

export interface ReviewPacket29 {
  readonly id: number;
  readonly bucket: string;
  readonly actor: string;
  readonly content: string;
  readonly createdAt: Date;
}

type StoredPacket29 = {
  id: number;
  bucket: string;
  actor: string;
  content: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText29(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize29(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot29(packet: StoredPacket29): ReviewPacket29 {
  return {
    id: packet.id,
    bucket: packet.bucket,
    actor: packet.actor,
    content: packet.content,
    createdAt: new Date(packet.createdAtMs),
  };
}

function createLookupToken29(packet: StoredPacket29): string {
  return createHash('sha256')
    .update(`${packet.id}:${packet.bucket}:${packet.actor}:${packet.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox29 {
  private packets: StoredPacket29[] = [];
  private nextId = 1;

  createPacket(bucket: string, actor: string, content: string): ReviewPacket29 {
    const normalizedContent = normalizeText29(content) || '[empty packet]';
    const packet: StoredPacket29 = {
      id: this.nextId++,
      bucket: normalizeText29(bucket) || 'default-bucket',
      actor: normalizeText29(actor) || 'unknown-actor',
      content: normalizedContent,
      createdAtMs: Date.now(),
      tokens: tokenize29(normalizedContent),
    };
    this.packets.push(packet);
    return snapshot29(packet);
  }

  buildPacketUrl(baseUrl: string, packetId: number): string {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return '';
    const url = new URL(`/packets/${packetId}`, baseUrl);
    url.hash = `packet=${createLookupToken29(packet)}`;
    return url.toString();
  }

  contentScore(packetId: number, phrase: string): number {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return 0;

    const tokens = tokenize29(phrase);
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
