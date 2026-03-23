export interface ReviewNote34 {
  readonly id: number;
  readonly scope: string;
  readonly reporter: string;
  readonly text: string;
  readonly createdAt: Date;
}

type StoredNote34 = {
  id: number;
  scope: string;
  reporter: string;
  text: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText34(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize34(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot34(note: StoredNote34): ReviewNote34 {
  return {
    id: note.id,
    scope: note.scope,
    reporter: note.reporter,
    text: note.text,
    createdAt: new Date(note.createdAtMs),
  };
}

export class ReviewSandbox34 {
  private notes: StoredNote34[] = [];
  private nextId = 1;

  createNote(scope: string, reporter: string, text: string): ReviewNote34 {
    const normalizedText = normalizeText34(text) || '[empty note]';
    const note: StoredNote34 = {
      id: this.nextId++,
      scope: normalizeText34(scope) || 'default-scope',
      reporter: normalizeText34(reporter) || 'unknown-reporter',
      text: normalizedText,
      createdAtMs: Date.now(),
      tokens: tokenize34(normalizedText),
    };
    this.notes.push(note);
    return snapshot34(note);
  }

  noteScore(noteId: number, phrase: string): number {
    const note = this.notes.find(item => item.id === noteId);
    if (!note) return 0;
    const tokens = tokenize34(phrase);
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
