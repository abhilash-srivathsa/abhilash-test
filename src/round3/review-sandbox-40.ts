export interface ReviewSignal40 {
  readonly id: number;
  readonly lane: string;
  readonly reporter: string;
  readonly message: string;
  readonly createdAt: Date;
}

type StoredSignal40 = {
  id: number;
  lane: string;
  reporter: string;
  message: string;
  createdAtMs: number;
};

function normalizeText40(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readString40(source: object, key: string): string {
  return normalizeText40(Reflect.get(source, key));
}

function readDateMs40(source: object, key: string): number | null {
  const value = Reflect.get(source, key);
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const createdAtMs = Date.parse(String(value));
  return Number.isFinite(createdAtMs) ? createdAtMs : null;
}

function snapshot40(signal: StoredSignal40): ReviewSignal40 {
  return {
    id: signal.id,
    lane: signal.lane,
    reporter: signal.reporter,
    message: signal.message,
    createdAt: new Date(signal.createdAtMs),
  };
}

function decodeSignal40(value: unknown): Omit<StoredSignal40, 'id'> | null {
  if (typeof value !== 'object' || value === null) return null;
  const lane = readString40(value, 'lane');
  const reporter = readString40(value, 'reporter');
  const message = readString40(value, 'message');
  const createdAtMs = readDateMs40(value, 'createdAt');
  if (!lane || !reporter || !message || createdAtMs === null) return null;
  return { lane, reporter, message, createdAtMs };
}

function createMatcher40(query: unknown): (signal: StoredSignal40) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;
  const checks: Array<(signal: StoredSignal40) => boolean> = [];
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

export class ReviewSandbox40 {
  private signals: StoredSignal40[] = [];
  private nextId = 1;

  createSignal(lane: string, reporter: string, message: string): ReviewSignal40 {
    const signal: StoredSignal40 = {
      id: this.nextId++,
      lane: normalizeText40(lane) || 'default-lane',
      reporter: normalizeText40(reporter) || 'unknown-reporter',
      message: normalizeText40(message) || '[empty signal]',
      createdAtMs: Date.now(),
    };
    this.signals.push(signal);
    return snapshot40(signal);
  }

  replaceSignals(query: unknown, nextMessage: string): number {
    const replacement = normalizeText40(nextMessage);
    if (!replacement) return 0;
    const matches = createMatcher40(query);
    let changed = 0;
    this.signals = this.signals.map(signal => {
      if (!matches(signal)) return signal;
      changed++;
      return { ...signal, message: replacement };
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
      const decoded = decodeSignal40(item);
      if (!decoded) continue;
      this.signals.push({ id: this.nextId++, ...decoded });
      loaded++;
    }
    return loaded;
  }
}
