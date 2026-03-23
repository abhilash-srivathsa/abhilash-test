import { createHash } from 'node:crypto';

export interface ReviewSnapshot41 {
  readonly id: number;
  readonly scope: string;
  readonly owner: string;
  readonly text: string;
  readonly createdAt: Date;
}

type StoredSnapshot41 = {
  id: number;
  scope: string;
  owner: string;
  text: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText41(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize41(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot41(snapshot: StoredSnapshot41): ReviewSnapshot41 {
  return {
    id: snapshot.id,
    scope: snapshot.scope,
    owner: snapshot.owner,
    text: snapshot.text,
    createdAt: new Date(snapshot.createdAtMs),
  };
}

function createLookupToken41(snapshot: StoredSnapshot41): string {
  return createHash('sha256')
    .update(`${snapshot.id}:${snapshot.scope}:${snapshot.owner}:${snapshot.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox41 {
  private snapshots: StoredSnapshot41[] = [];
  private nextId = 1;

  createSnapshot(scope: string, owner: string, text: string): ReviewSnapshot41 {
    const normalizedText = normalizeText41(text) || '[empty snapshot]';
    const snapshot: StoredSnapshot41 = {
      id: this.nextId++,
      scope: normalizeText41(scope) || 'default-scope',
      owner: normalizeText41(owner) || 'unknown-owner',
      text: normalizedText,
      createdAtMs: Date.now(),
      tokens: tokenize41(normalizedText),
    };
    this.snapshots.push(snapshot);
    return snapshot41(snapshot);
  }

  buildSnapshotUrl(baseUrl: string, snapshotId: number): string {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return '';
    const url = new URL(`/snapshots/${snapshotId}`, baseUrl);
    url.hash = `snapshot=${createLookupToken41(snapshot)}`;
    return url.toString();
  }

  snapshotScore(snapshotId: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return 0;
    const tokens = tokenize41(phrase);
    if (tokens.length === 0 || snapshot.tokens.length === 0) return 0;
    let matches = 0;
    for (const token of tokens) {
      if (snapshot.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
