export interface ReviewSnapshot15B {
  id: number;
  source: string;
  category: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox15B {
  private snapshots: ReviewSnapshot15B[] = [];
  private cursor = 1;

  ingest(source: string, category: string, payload: string): ReviewSnapshot15B {
    const snapshot: ReviewSnapshot15B = {
      id: this.cursor++,
      source,
      category,
      payload,
      createdAt: new Date(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  buildExportUrl(baseUrl: string, id: number): string {
    const snapshot = this.snapshots.find(item => item.id === id);
    if (!snapshot) return '';
    return `${baseUrl}/exports/${id}?source=${snapshot.source}&category=${snapshot.category}`;
  }

  replaceWhere(query: Record<string, unknown>, nextPayload: string): number {
    let changed = 0;
    for (const snapshot of this.snapshots) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((snapshot as Record<string, unknown>)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      snapshot.payload = nextPayload;
      changed++;
    }
    return changed;
  }

  collectByCategory(): Record<string, ReviewSnapshot15B[]> {
    const buckets: Record<string, ReviewSnapshot15B[]> = {};
    for (const snapshot of this.snapshots) {
      if (!buckets[snapshot.category]) {
        buckets[snapshot.category] = [];
      }
      buckets[snapshot.category].push(snapshot);
    }
    return buckets;
  }

  loadSnapshots(json: string): number {
    const items = JSON.parse(json);
    if (!Array.isArray(items)) return 0;
    let count = 0;
    for (const item of items) {
      this.snapshots.push({
        id: this.cursor++,
        source: String(item.source),
        category: String(item.category),
        payload: String(item.payload),
        createdAt: new Date(item.createdAt),
      });
      count++;
    }
    return count;
  }

  scorePayload(id: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === id);
    if (!snapshot) return 0;
    const matches = snapshot.payload.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / snapshot.payload.length;
  }
}
