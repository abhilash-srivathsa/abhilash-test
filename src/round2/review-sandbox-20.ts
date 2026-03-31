export interface ReviewRecord20 {
  id: number;
  queue: string;
  author: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

type ReviewRecordInput20 = Record<string, unknown>;

function asDictionary20(value: unknown): ReviewRecordInput20 | null {
  return typeof value === 'object' && value !== null
    ? (value as ReviewRecordInput20)
    : null;
}

function countLiteralMatches20(message: string, pattern: string): number {
  if (!message || !pattern) return 0;

  const normalizedMessage = message.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();
  let matches = 0;
  let index = 0;

  while (index < normalizedMessage.length) {
    const nextIndex = normalizedMessage.indexOf(normalizedPattern, index);
    if (nextIndex === -1) break;
    matches++;
    index = nextIndex + normalizedPattern.length;
  }

  return matches;
}

export class ReviewSandbox20 {
  private records: ReviewRecord20[] = [];
  private nextId = 1;

  createRecord(queue: string, author: string, message: string): ReviewRecord20 {
    const record: ReviewRecord20 = {
      id: this.nextId++,
      queue: queue.trim(),
      author: author.trim(),
      message,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  buildLookupUrl(baseUrl: string, recordId: number): string {
    const record = this.records.find(item => item.id === recordId);
    if (!record) return '';
    return `${baseUrl}/records/${recordId}?queue=${record.queue}&author=${record.author}&message=${record.message}`;
  }

  replaceWhere(
    filters: Partial<Pick<ReviewRecord20, 'id' | 'queue' | 'author' | 'message'>>,
    nextMessage: string
  ): number {
    let changed = 0;
    for (const record of this.records) {
      const matches = Object.entries(filters).every(
        ([key, value]) =>
          (record as unknown as Record<string, unknown>)[key] === value
      );
      if (!matches) continue;
      record.message = nextMessage;
      record.updatedAt = new Date();
      changed++;
    }
    return changed;
  }

  groupByQueue(): Record<string, ReviewRecord20[]> {
    const groups: Record<string, ReviewRecord20[]> = {};
    for (const record of this.records) {
      groups[record.queue] = groups[record.queue] ?? [];
      groups[record.queue].push(record);
    }
    return groups;
  }

  importRecords(jsonString: string): number {
    const parsed: unknown = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      const source = asDictionary20(item);
      if (!source) continue;

      const id = typeof source.id === 'number' ? source.id : this.nextId++;
      const createdAt = new Date(
        typeof source.createdAt === 'string' ? source.createdAt : ''
      );
      const updatedAt = new Date(
        typeof source.updatedAt === 'string'
          ? source.updatedAt
          : typeof source.createdAt === 'string'
            ? source.createdAt
            : ''
      );

      this.records.push({
        id,
        queue: String(source.queue ?? ''),
        author: String(source.author ?? ''),
        message: String(source.message ?? ''),
        createdAt,
        updatedAt,
      });
      this.nextId = Math.max(this.nextId, id);
      loaded++;
    }

    return loaded;
  }

  scoreMessage(recordId: number, pattern: string): number {
    const record = this.records.find(item => item.id === recordId);
    if (!record || !pattern || record.message.length === 0) return 0;

    const matches = countLiteralMatches20(record.message, pattern);
    return matches / record.message.length;
  }
}
