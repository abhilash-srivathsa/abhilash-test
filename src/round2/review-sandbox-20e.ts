export interface ReviewPacket20E {
  id: number;
  queue: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox20E {
  private packets: ReviewPacket20E[] = [];
  private nextId = 1;

  createPacket(queue: string, actor: string, payload: string): ReviewPacket20E {
    const packet: ReviewPacket20E = {
      id: this.nextId++,
      queue,
      actor,
      payload,
      createdAt: new Date(),
    };
    this.packets.push(packet);
    return packet;
  }

  importPackets(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.packets.push({
        id: this.nextId++,
        queue: String(item.queue),
        actor: String(item.actor),
        payload: String(item.payload),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  payloadScore(packetId: number, phrase: string): number {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return 0;
    const matches = packet.payload.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / packet.payload.length;
  }
}
