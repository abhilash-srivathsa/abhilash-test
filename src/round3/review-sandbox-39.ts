export interface ReviewPacket39 {
  id: number;
  bucket: string;
  actor: string;
  content: string;
  createdAt: Date;
}

export class ReviewSandbox39 {
  private packets: ReviewPacket39[] = [];
  private nextId = 1;

  createPacket(bucket: string, actor: string, content: string): ReviewPacket39 {
    const packet: ReviewPacket39 = {
      id: this.nextId++,
      bucket,
      actor,
      content,
      createdAt: new Date(),
    };
    this.packets.push(packet);
    return packet;
  }

  buildPacketUrl(baseUrl: string, packetId: number): string {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return '';
    return `${baseUrl}/packets/${packetId}?bucket=${packet.bucket}&actor=${packet.actor}`;
  }

  contentScore(packetId: number, phrase: string): number {
    const packet = this.packets.find(item => item.id === packetId);
    if (!packet) return 0;
    const matches = packet.content.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / packet.content.length;
  }
}
