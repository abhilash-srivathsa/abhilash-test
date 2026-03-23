export interface ReviewRecord26 {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox26 {
  private records: ReviewRecord26[] = [];
  private nextId = 1;

  createRecord(lane: string, actor: string, payload: string): ReviewRecord26 {
    const record: ReviewRecord26 = {
      id: this.nextId++,
      lane,
      actor,
      payload,
      createdAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  importRecords(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.records.push({
        id: this.nextId++,
        lane: String(item.lane),
        actor: String(item.actor),
        payload: String(item.payload),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  payloadScore(recordId: number, phrase: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return 0;
    const matches = record.payload.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / record.payload.length;
  }
}
