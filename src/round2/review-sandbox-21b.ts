export interface ReviewSnapshot21B {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

// Comment-only follow-up commit for reviewer retesting.
export class ReviewSandbox21B {
  private snapshots: ReviewSnapshot21B[] = [];
  private nextId = 1;

  createSnapshot(lane: string, actor: string, payload: string): ReviewSnapshot21B {
    const snapshot: ReviewSnapshot21B = {
      id: this.nextId++,
      lane,
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
    return `${baseUrl}/shares/${snapshotId}?lane=${snapshot.lane}&actor=${snapshot.actor}`;
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

  importSnapshots(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.snapshots.push({
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

  payloadScore(snapshotId: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return 0;
    const matches = snapshot.payload.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / snapshot.payload.length;
  }
}
// Round-2 comment-only trigger for reviewer retesting.
// Round-3 comment-only trigger for reviewer retesting.
