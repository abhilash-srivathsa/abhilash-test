import { createHash } from 'node:crypto';

// Comment-only follow-up commit for reviewer retesting.
export interface ReviewSnapshot51 {
  readonly id: number;
  readonly scope: string;
  readonly owner: string;
  readonly text: string;
  readonly createdAt: Date;
}

type StoredSnapshot51 = {
  id: number;
  scope: string;
  owner: string;
  text: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText51(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize51(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot51(snapshot: StoredSnapshot51): ReviewSnapshot51 {
  return {
    id: snapshot.id,
    scope: snapshot.scope,
    owner: snapshot.owner,
    text: snapshot.text,
    createdAt: new Date(snapshot.createdAtMs),
  };
}

function createLookupToken51(snapshot: StoredSnapshot51): string {
  return createHash('sha256')
    .update(`${snapshot.id}:${snapshot.scope}:${snapshot.owner}:${snapshot.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox51 {
  private snapshots: StoredSnapshot51[] = [];
  private nextId = 1;

  createSnapshot(scope: string, owner: string, text: string): ReviewSnapshot51 {
    const normalizedText = normalizeText51(text) || '[empty snapshot]';
    const snapshot: StoredSnapshot51 = {
      id: this.nextId++,
      scope: normalizeText51(scope) || 'default-scope',
      owner: normalizeText51(owner) || 'unknown-owner',
      text: normalizedText,
      createdAtMs: Date.now(),
      tokens: tokenize51(normalizedText),
    };
    this.snapshots.push(snapshot);
    return snapshot51(snapshot);
  }

  buildSnapshotUrl(baseUrl: string, snapshotId: number): string {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return '';
    const url = new URL(`/snapshots/${snapshotId}`, baseUrl);
    url.hash = `snapshot=${createLookupToken51(snapshot)}`;
    return url.toString();
  }

  snapshotScore(snapshotId: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return 0;
    const tokens = tokenize51(phrase);
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
// Round-2 comment-only trigger for reviewer retesting.
