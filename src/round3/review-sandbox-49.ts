import { createHash } from 'node:crypto';

// Comment-only follow-up commit for reviewer retesting.
export interface ReviewPacket49 {
  readonly id: number;
  readonly bucket: string;
  readonly actor: string;
  readonly content: string;
  readonly createdAt: Date;
}

type StoredPacket49 = {
  id: number;
  bucket: string;
  actor: string;
  content: string;
  createdAtMs: number;
};

function normalizeText49(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot49(packet: StoredPacket49): ReviewPacket49 {
  return {
    id: packet.id,
    bucket: packet.bucket,
    actor: packet.actor,
    content: packet.content,
    createdAt: new Date(packet.createdAtMs),
  };
}

function createLookupToken49(packet: StoredPacket49): string {
  return createHash('sha256')
    .update(`${packet.id}:${packet.bucket}:${packet.actor}:${packet.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox49 {
  private packets: StoredPacket49[] = [];
  private nextId = 1;

  createPacket(bucket: string, actor: string, content: string): ReviewPacket49 {
    const packet: StoredPacket49 = {
      id: this.nextId++,
      bucket: normalizeText49(bucket) || 'default-bucket',
      actor: normalizeText49(actor) || 'unknown-actor',
      content: normalizeText49(content) || '[empty packet]',
      createdAtMs: Date.now(),
    };
    this.packets.push(packet);
    return snapshot49(packet);
  }

  buildPacketUrl(baseUrl: string, packetId: number): string {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return '';
    const url = new URL(`/packets/${packetId}`, baseUrl);
    url.hash = `packet=${createLookupToken49(packet)}`;
    return url.toString();
  }
}
// Round-2 comment-only trigger for reviewer retesting.
