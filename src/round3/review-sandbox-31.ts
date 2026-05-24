import { createHash } from 'node:crypto';

export interface ReviewSnapshot31 {
  readonly id: number;
  readonly scope: string;
  readonly owner: string;
  readonly text: string;
  readonly createdAt: Date;
}

type StoredSnapshot31 = {
  id: number;
  scope: string;
  owner: string;
  text: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText31(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize31(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot31(snapshot: StoredSnapshot31): ReviewSnapshot31 {
  return {
    id: snapshot.id,
    scope: snapshot.scope,
    owner: snapshot.owner,
    text: snapshot.text,
    createdAt: new Date(snapshot.createdAtMs),
  };
}

function createLookupToken31(snapshot: StoredSnapshot31): string {
  return createHash('sha256')
    .update(`${snapshot.id}:${snapshot.scope}:${snapshot.owner}:${snapshot.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox31 {
  private snapshots: StoredSnapshot31[] = [];
  private nextId = 1;

  createSnapshot(scope: string, owner: string, text: string): ReviewSnapshot31 {
    const normalizedText = normalizeText31(text) || '[empty snapshot]';
    const snapshot: StoredSnapshot31 = {
      id: this.nextId++,
      scope: normalizeText31(scope) || 'default-scope',
      owner: normalizeText31(owner) || 'unknown-owner',
      text: normalizedText,
      createdAtMs: Date.now(),
      tokens: tokenize31(normalizedText),
    };
    this.snapshots.push(snapshot);
    return snapshot31(snapshot);
  }

  buildSnapshotUrl(baseUrl: string, snapshotId: number): string {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return '';
    const url = new URL(`/snapshots/${snapshotId}`, baseUrl);
    url.hash = `snapshot=${createLookupToken31(snapshot)}`;
    return url.toString();
  }

  scoreSnapshot(snapshotId: number, phrase: string): number {
    const snapshot = this.snapshots.find(item => item.id === snapshotId);
    if (!snapshot) return 0;

    const tokens = tokenize31(phrase);
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
