export interface ReviewMessage24 {
  readonly id: number;
  readonly area: string;
  readonly reporter: string;
  readonly text: string;
  readonly createdAt: Date;
}

type StoredMessage24 = {
  id: number;
  area: string;
  reporter: string;
  text: string;
  createdAtMs: number;
  tokens: string[];
};

function normalizeText24(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function tokenize24(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map(part => part.trim())
    .filter(Boolean);
}

function snapshot24(message: StoredMessage24): ReviewMessage24 {
  return {
    id: message.id,
    area: message.area,
    reporter: message.reporter,
    text: message.text,
    createdAt: new Date(message.createdAtMs),
  };
}

export class ReviewSandbox24 {
  private messages: StoredMessage24[] = [];
  private nextId = 1;

  createMessage(area: string, reporter: string, text: string): ReviewMessage24 {
    const normalizedText = normalizeText24(text) || '[empty message]';
    const message: StoredMessage24 = {
      id: this.nextId++,
      area: normalizeText24(area) || 'general',
      reporter: normalizeText24(reporter) || 'unknown-reporter',
      text: normalizedText,
      createdAtMs: Date.now(),
      tokens: tokenize24(normalizedText),
    };
    this.messages.push(message);
    return snapshot24(message);
  }

  scoreMessage(messageId: number, phrase: string): number {
    const message = this.messages.find(item => item.id === messageId);
    if (!message) return 0;

    const tokens = tokenize24(phrase);
    if (tokens.length === 0 || message.tokens.length === 0) return 0;

    let matches = 0;
    for (const token of tokens) {
      if (message.tokens.includes(token)) {
        matches++;
      }
    }
    return matches / tokens.length;
  }
}
