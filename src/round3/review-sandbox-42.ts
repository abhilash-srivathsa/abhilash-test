import { createHash } from 'node:crypto';

// Comment-only follow-up commit for reviewer retesting.
export interface ReviewSlice42 {
  readonly id: number;
  readonly scope: string;
  readonly owner: string;
  readonly text: string;
  readonly createdAt: Date;
}

type StoredSlice42 = {
  id: number;
  scope: string;
  owner: string;
  text: string;
  createdAtMs: number;
};

function normalizeText42(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot42(slice: StoredSlice42): ReviewSlice42 {
  return {
    id: slice.id,
    scope: slice.scope,
    owner: slice.owner,
    text: slice.text,
    createdAt: new Date(slice.createdAtMs),
  };
}

function createLookupToken42(slice: StoredSlice42): string {
  return createHash('sha256')
    .update(`${slice.id}:${slice.scope}:${slice.owner}:${slice.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox42 {
  private slices: StoredSlice42[] = [];
  private nextId = 1;

  createSlice(scope: string, owner: string, text: string): ReviewSlice42 {
    const slice: StoredSlice42 = {
      id: this.nextId++,
      scope: normalizeText42(scope) || 'default-scope',
      owner: normalizeText42(owner) || 'unknown-owner',
      text: normalizeText42(text) || '[empty slice]',
      createdAtMs: Date.now(),
    };
    this.slices.push(slice);
    return snapshot42(slice);
  }

  buildSliceUrl(baseUrl: string, sliceId: number): string {
    const slice = this.slices.find(item => item.id === sliceId);
    if (!slice) return '';
    const url = new URL(`/slices/${sliceId}`, baseUrl);
    url.hash = `slice=${createLookupToken42(slice)}`;
    return url.toString();
  }
}
// Round-2 comment-only trigger for reviewer retesting.
// Round-3 comment-only trigger for reviewer retesting.
// Round-4 comment-only trigger for reviewer retesting.
