export interface ReviewSnapshot18B {
  id: number;
  bucket: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox18B {
  private snapshots: ReviewSnapshot18B[] = [];
  private nextId = 1;

  createSnapshot(bucket: string, actor: string, payload: string): ReviewSnapshot18B {
    const snapshot: ReviewSnapshot18B = {
      id: this.nextId++,
      bucket,
      actor,
      payload,
      createdAt: new Date(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  buildShareUrl(baseUrl: string, snapshotId: number): string {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return '';
    return `${baseUrl}/snapshots/${snapshotId}?bucket=${snapshot.bucket}&actor=${snapshot.actor}`;
  }

  patchSnapshots(query: Record<string, unknown>, nextPayload: string): number {
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

  collectBuckets(): Record<string, ReviewSnapshot18B[]> {
    const buckets: Record<string, ReviewSnapshot18B[]> = {};
    for (const snapshot of this.snapshots) {
      if (!buckets[snapshot.bucket]) {
        buckets[snapshot.bucket] = [];
      }
      buckets[snapshot.bucket].push(snapshot);
    }
    return buckets;
  }

  importSnapshots(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.snapshots.push({
        id: this.nextId++,
        bucket: String(item.bucket),
        actor: String(item.actor),
        payload: String(item.payload),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  payloadScore(snapshotId: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return 0;
    const matches = snapshot.payload.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / snapshot.payload.length;
  }
}
