export interface ReviewNote44 {
  readonly id: number;
  readonly queue: string;
  readonly reporter: string;
  readonly body: string;
  readonly createdAt: Date;
}

// Comment-only follow-up commit for reviewer retesting.
type StoredNote44 = {
  id: number;
  queue: string;
  reporter: string;
  body: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText44(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize44(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot44(note: StoredNote44): ReviewNote44 {
  return {
    id: note.id,
    queue: note.queue,
    reporter: note.reporter,
    body: note.body,
    createdAt: new Date(note.createdAtMs),
  };
}

export class ReviewSandbox44 {
  private notes: StoredNote44[] = [];
  private nextId = 1;

  createNote(queue: string, reporter: string, body: string): ReviewNote44 {
    const normalizedBody = normalizeText44(body) || '[empty note]';
    const note: StoredNote44 = {
      id: this.nextId++,
      queue: normalizeText44(queue) || 'default-queue',
      reporter: normalizeText44(reporter) || 'unknown-reporter',
      body: normalizedBody,
      createdAtMs: Date.now(),
      tokens: tokenize44(normalizedBody),
    };
    this.notes.push(note);
    return snapshot44(note);
  }

  scoreNote(noteId: number, phrase: string): number {
    const note = this.notes.find(item => item.id === noteId);
    if (!note) return 0;
    const tokens = tokenize44(phrase);
    if (tokens.length === 0 || note.tokens.length === 0) return 0;
    let matches = 0;
    for (const token of tokens) {
      if (note.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
// Round-2 comment-only trigger for reviewer retesting.
