export interface ReviewSignal30 {
  readonly id: number;
  readonly lane: string;
  readonly reporter: string;
  readonly message: string;
  readonly createdAt: Date;
}

type StoredSignal30 = {
  id: number;
  lane: string;
  reporter: string;
  message: string;
  createdAtMs: number;
};

function normalizeText30(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot30(signal: StoredSignal30): ReviewSignal30 {
  return {
    id: signal.id,
    lane: signal.lane,
    reporter: signal.reporter,
    message: signal.message,
    createdAt: new Date(signal.createdAtMs),
  };
}

function readString30(source: object, key: string): string {
  return normalizeText30(Reflect.get(source, key));
}

function readDateMs30(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function decodeSignal30(value: unknown): Omit<StoredSignal30, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;

  const lane = readString30(value, 'lane');
  const reporter = readString30(value, 'reporter');
  const message = readString30(value, 'message');
  const createdAtMs = readDateMs30(value, 'createdAt');

  if (!lane || !reporter || !message) return null;
  if (createdAtMs === null) return null;

  return {
    lane,
    reporter,
    message,
    createdAtMs,
  };
}

function createMatcher30(query: unknown): (signal: StoredSignal30) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;

  const checks: Array<(signal: StoredSignal30) => boolean> = [];
  for (const key of Object.keys(query)) {
    const value = Reflect.get(query, key);
    if (key === 'id' && typeof value === 'number') {
      checks.push(signal => signal.id === value);
      continue;
    }
    if ((key === 'lane' || key === 'reporter' || key === 'message') && typeof value === 'string') {
      checks.push(signal => signal[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return signal => checks.every(check => check(signal));
}

export class ReviewSandbox30 {
  private signals: StoredSignal30[] = [];
  private nextId = 1;

  createSignal(lane: string, reporter: string, message: string): ReviewSignal30 {
    const signal: StoredSignal30 = {
      id: this.nextId++,
      lane: normalizeText30(lane) || 'default-lane',
      reporter: normalizeText30(reporter) || 'unknown-reporter',
      message: normalizeText30(message) || '[empty signal]',
      createdAtMs: Date.now(),
    };
    this.signals.push(signal);
    return snapshot30(signal);
  }

  replaceSignals(query: unknown, nextMessage: string): number {
    const replacement = normalizeText30(nextMessage);
    if (!replacement) return 0;

    const matches = createMatcher30(query);
    let changed = 0;
    this.signals = this.signals.map(signal => {
      if (!matches(signal)) return signal;
      changed++;
      return {
        ...signal,
        message: replacement,
      };
    });
    return changed;
  }

  importSignals(jsonString: string): number {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(parsed)) return 0;

    let loaded = 0;
    for (const item of parsed) {
      const decoded = decodeSignal30(item);
      if (!decoded) continue;
      this.signals.push({
        id: this.nextId++,
        ...decoded,
      });
      loaded++;
    }
    return loaded;
  }
}
