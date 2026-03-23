export interface ReviewSignal50 {
  readonly id: number;
  readonly lane: string;
  readonly reporter: string;
  readonly message: string;
  readonly createdAt: Date;
}

type StoredSignal50 = {
  id: number;
  lane: string;
  reporter: string;
  message: string;
  createdAtMs: number;
};

function normalizeText50(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot50(signal: StoredSignal50): ReviewSignal50 {
  return {
    id: signal.id,
    lane: signal.lane,
    reporter: signal.reporter,
    message: signal.message,
    createdAt: new Date(signal.createdAtMs),
  };
}

function createMatcher50(query: unknown): (signal: StoredSignal50) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;
  const checks: Array<(signal: StoredSignal50) => boolean> = [];
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

export class ReviewSandbox50 {
  private signals: StoredSignal50[] = [];
  private nextId = 1;

  createSignal(lane: string, reporter: string, message: string): ReviewSignal50 {
    const signal: StoredSignal50 = {
      id: this.nextId++,
      lane: normalizeText50(lane) || 'default-lane',
      reporter: normalizeText50(reporter) || 'unknown-reporter',
      message: normalizeText50(message) || '[empty signal]',
      createdAtMs: Date.now(),
    };
    this.signals.push(signal);
    return snapshot50(signal);
  }

  replaceSignals(query: unknown, nextMessage: string): number {
    const replacement = normalizeText50(nextMessage);
    if (!replacement) return 0;
    const matches = createMatcher50(query);
    let changed = 0;
    this.signals = this.signals.map(signal => {
      if (!matches(signal)) return signal;
      changed++;
      return { ...signal, message: replacement };
    });
    return changed;
  }
}
