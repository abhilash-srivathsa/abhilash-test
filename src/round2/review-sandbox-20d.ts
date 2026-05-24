import { createHash } from 'node:crypto';

export interface ReviewSnippet20D {
  readonly id: number;
  readonly channel: string;
  readonly owner: string;
  readonly body: string;
  readonly createdAt: Date;
}

type StoredSnippet20D = {
  id: number;
  channel: string;
  owner: string;
  body: string;
  createdAtMs: number;
};

function normalizeText20D(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot20D(snippet: StoredSnippet20D): ReviewSnippet20D {
  return {
    id: snippet.id,
    channel: snippet.channel,
    owner: snippet.owner,
    body: snippet.body,
    createdAt: new Date(snippet.createdAtMs),
  };
}

function asDictionary20D(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function createMatcher20D(query: unknown): (snippet: StoredSnippet20D) => boolean {
  const source = asDictionary20D(query);
  if (!source) return () => false;

  const checks: Array<(snippet: StoredSnippet20D) => boolean> = [];
  for (const [key, value] of Object.entries(source)) {
    if (key === 'id' && typeof value === 'number') {
      checks.push(snippet => snippet.id === value);
      continue;
    }
    if ((key === 'channel' || key === 'owner' || key === 'body') && typeof value === 'string') {
      checks.push(snippet => snippet[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return snippet => checks.every(check => check(snippet));
}

function createSnippetToken20D(snippet: StoredSnippet20D): string {
  return createHash('sha256')
    .update(`${snippet.id}:${snippet.channel}:${snippet.owner}:${snippet.createdAtMs}`)
    .digest('base64url');
}

export class ReviewSandbox20D {
  private snippets: StoredSnippet20D[] = [];
  private nextId = 1;

  createSnippet(channel: string, owner: string, body: string): ReviewSnippet20D {
    const snippet: StoredSnippet20D = {
      id: this.nextId++,
      channel: normalizeText20D(channel) || 'default-channel',
      owner: normalizeText20D(owner) || 'unknown-owner',
      body: normalizeText20D(body) || '[empty snippet]',
      createdAtMs: Date.now(),
    };
    this.snippets.push(snippet);
    return snapshot20D(snippet);
  }

  buildSnippetUrl(baseUrl: string, snippetId: number): string {
    const snippet = this.snippets.find(item => item.id === snippetId);
    if (!snippet) return '';
    const url = new URL(`/snippets/${snippetId}`, baseUrl);
    url.hash = `snippet=${createSnippetToken20D(snippet)}`;
    return url.toString();
  }

  replaceSnippets(query: unknown, nextBody: string): number {
    const replacement = normalizeText20D(nextBody);
    if (!replacement) return 0;
    const matches = createMatcher20D(query);

    let changed = 0;
    this.snippets = this.snippets.map(snippet => {
      if (!matches(snippet)) return snippet;
      changed++;
      return {
        ...snippet,
        body: replacement,
      };
    });
    return changed;
  }

  collectByChannel(): Record<string, ReviewSnippet20D[]> {
    const groups = new Map<string, ReviewSnippet20D[]>();
    for (const snippet of this.snippets) {
      const items = groups.get(snippet.channel) ?? [];
      items.push(snapshot20D(snippet));
      groups.set(snippet.channel, items);
    }
    return Object.fromEntries(groups);
  }
}
