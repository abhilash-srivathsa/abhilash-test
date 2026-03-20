import { createHash } from 'node:crypto';

export interface ReviewFragment20C {
  readonly id: number;
  readonly topic: string;
  readonly author: string;
  readonly text: string;
  readonly createdAt: Date;
}

type StoredFragment20C = {
  id: number;
  topic: string;
  author: string;
  text: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText20C(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize20C(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot20C(fragment: StoredFragment20C): ReviewFragment20C {
  return {
    id: fragment.id,
    topic: fragment.topic,
    author: fragment.author,
    text: fragment.text,
    createdAt: new Date(fragment.createdAtMs),
  };
}

function asDictionary20C(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function decodeFragment20C(value: unknown): Omit<StoredFragment20C, 'id' | 'tokens'> | null {
  const source = asDictionary20C(value);
  if (!source) return null;

  const topic = normalizeText20C(source.topic);
  const author = normalizeText20C(source.author);
  const text = normalizeText20C(source.text);
  const createdAtText = typeof source.createdAt === 'string' ? source.createdAt : '';
  const createdAtMs = Date.parse(createdAtText);

  if (!topic || !author || !text) return null;
  if (!Number.isFinite(createdAtMs)) return null;

  return {
    topic,
    author,
    text,
    createdAtMs,
  };
}

function createLookupToken20C(fragment: StoredFragment20C): string {
  return createHash('sha256')
    .update(`${fragment.id}:${fragment.topic}:${fragment.author}:${fragment.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox20C {
  private fragments: StoredFragment20C[] = [];
  private nextId = 1;

  createFragment(topic: string, author: string, text: string): ReviewFragment20C {
    const normalizedText = normalizeText20C(text) || '[empty fragment]';
    const fragment: StoredFragment20C = {
      id: this.nextId++,
      topic: normalizeText20C(topic) || 'general',
      author: normalizeText20C(author) || 'unknown-author',
      text: normalizedText,
      createdAtMs: Date.now(),
      tokens: tokenize20C(normalizedText),
    };
    this.fragments.push(fragment);
    return snapshot20C(fragment);
  }

  buildFragmentUrl(baseUrl: string, fragmentId: number): string {
    const fragment = this.fragments.find(item => item.id === fragmentId);
    if (!fragment) return '';
    const url = new URL(`/fragments/${fragmentId}`, baseUrl);
    url.hash = `fragment=${createLookupToken20C(fragment)}`;
    return url.toString();
  }

  importFragments(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeFragment20C(item);
      if (!decoded) continue;
      this.fragments.push({
        id: this.nextId++,
        ...decoded,
        tokens: tokenize20C(decoded.text),
      });
      loaded++;
    }
    return loaded;
  }

  scoreFragment(fragmentId: number, phrase: string): number {
    const fragment = this.fragments.find(item => item.id === fragmentId);
    if (!fragment) return 0;
    const tokens = tokenize20C(phrase);
    if (tokens.length === 0 || fragment.tokens.length === 0) return 0;

    let matches = 0;
    for (const token of tokens) {
      if (fragment.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
