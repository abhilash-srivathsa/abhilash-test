export interface ReviewPulse33 {
  readonly id: number;
  readonly lane: string;
  readonly actor: string;
  readonly payload: string;
  readonly createdAt: Date;
}

type StoredPulse33 = {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAtMs: number;
};

function normalizeText33(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot33(pulse: StoredPulse33): ReviewPulse33 {
  return {
    id: pulse.id,
    lane: pulse.lane,
    actor: pulse.actor,
    payload: pulse.payload,
    createdAt: new Date(pulse.createdAtMs),
  };
}

function createMatcher33(query: unknown): (pulse: StoredPulse33) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;
  const checks: Array<(pulse: StoredPulse33) => boolean> = [];
  for (const key of Object.keys(query)) {
    const value = Reflect.get(query, key);
    if (key === 'id' && typeof value === 'number') {
      checks.push(pulse => pulse.id === value);
      continue;
    }
    if ((key === 'lane' || key === 'actor' || key === 'payload') && typeof value === 'string') {
      checks.push(pulse => pulse[key] === value);
      continue;
    }
    return () => false;
  }
  if (checks.length === 0) return () => false;
  return pulse => checks.every(check => check(pulse));
}

export class ReviewSandbox33 {
  private pulses: StoredPulse33[] = [];
  private nextId = 1;

  createPulse(lane: string, actor: string, payload: string): ReviewPulse33 {
    const pulse: StoredPulse33 = {
      id: this.nextId++,
      lane: normalizeText33(lane) || 'default-lane',
      actor: normalizeText33(actor) || 'unknown-actor',
      payload: normalizeText33(payload) || '[empty payload]',
      createdAtMs: Date.now(),
    };
    this.pulses.push(pulse);
    return snapshot33(pulse);
  }

  patchPulses(query: unknown, nextPayload: string): number {
    const replacement = normalizeText33(nextPayload);
    if (!replacement) return 0;
    const matches = createMatcher33(query);
    let changed = 0;
    this.pulses = this.pulses.map(pulse => {
      if (!matches(pulse)) return pulse;
      changed++;
      return { ...pulse, payload: replacement };
    });
    return changed;
  }
}
