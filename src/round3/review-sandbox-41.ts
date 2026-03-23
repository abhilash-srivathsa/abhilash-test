export interface ReviewSnapshot41 {
  id: number;
  scope: string;
  owner: string;
  text: string;
  createdAt: Date;
}

export class ReviewSandbox41 {
  private snapshots: ReviewSnapshot41[] = [];
  private nextId = 1;

  createSnapshot(scope: string, owner: string, text: string): ReviewSnapshot41 {
    const snapshot: ReviewSnapshot41 = {
      id: this.nextId++,
      scope,
      owner,
      text,
      createdAt: new Date(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  buildSnapshotUrl(baseUrl: string, snapshotId: number): string {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return '';
    return `${baseUrl}/snapshots/${snapshotId}?scope=${snapshot.scope}&owner=${snapshot.owner}`;
  }

  snapshotScore(snapshotId: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return 0;
    const matches = snapshot.text.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / snapshot.text.length;
  }
}
