export interface ReviewAlert23 {
  readonly id: number;
  readonly stream: string;
  readonly actor: string;
  readonly payload: string;
  readonly createdAt: Date;
}

type StoredAlert23 = {
  id: number;
  stream: string;
  actor: string;
  payload: string;
  createdAtMs: number;
};

function normalizeText23(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot23(alert: StoredAlert23): ReviewAlert23 {
  return {
    id: alert.id,
    stream: alert.stream,
    actor: alert.actor,
    payload: alert.payload,
    createdAt: new Date(alert.createdAtMs),
  };
}

function createMatcher23(query: unknown): (alert: StoredAlert23) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;

  const checks: Array<(alert: StoredAlert23) => boolean> = [];
  for (const key of Object.keys(query)) {
    const value = Reflect.get(query, key);
    if (key === 'id' && typeof value === 'number') {
      checks.push(alert => alert.id === value);
      continue;
    }
    if ((key === 'stream' || key === 'actor' || key === 'payload') && typeof value === 'string') {
      checks.push(alert => alert[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return alert => checks.every(check => check(alert));
}

export class ReviewSandbox23 {
  private alerts: StoredAlert23[] = [];
  private nextId = 1;

  createAlert(stream: string, actor: string, payload: string): ReviewAlert23 {
    const alert: StoredAlert23 = {
      id: this.nextId++,
      stream: normalizeText23(stream) || 'default-stream',
      actor: normalizeText23(actor) || 'unknown-actor',
      payload: normalizeText23(payload) || '[empty payload]',
      createdAtMs: Date.now(),
    };
    this.alerts.push(alert);
    return snapshot23(alert);
  }

  replaceAlerts(query: unknown, nextPayload: string): number {
    const replacement = normalizeText23(nextPayload);
    if (!replacement) return 0;

    const matches = createMatcher23(query);
    let changed = 0;
    this.alerts = this.alerts.map(alert => {
      if (!matches(alert)) return alert;
      changed++;
      return {
        ...alert,
        payload: replacement,
      };
    });
    return changed;
  }

  groupByStream(): Record<string, ReviewAlert23[]> {
    const groups = new Map<string, ReviewAlert23[]>();
    for (const alert of this.alerts) {
      const items = groups.get(alert.stream) ?? [];
      items.push(snapshot23(alert));
      groups.set(alert.stream, items);
    }
    return Object.fromEntries(groups);
  }
}
