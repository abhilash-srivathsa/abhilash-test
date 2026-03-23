export interface ReviewPacket49 {
  id: number;
  bucket: string;
  actor: string;
  content: string;
  createdAt: Date;
}

export class ReviewSandbox49 {
  private packets: ReviewPacket49[] = [];
  private nextId = 1;

  createPacket(bucket: string, actor: string, content: string): ReviewPacket49 {
    const packet: ReviewPacket49 = {
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
}
