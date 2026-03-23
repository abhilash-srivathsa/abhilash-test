export interface ReviewPulse43 {
  readonly id: number;
  readonly lane: string;
  readonly actor: string;
  readonly payload: string;
  readonly createdAt: Date;
}

// Comment-only follow-up commit for reviewer retesting.
type StoredPulse43 = {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAtMs: number;
};

function normalizeText43(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot43(pulse: StoredPulse43): ReviewPulse43 {
  return {
    id: pulse.id,
    lane: pulse.lane,
    actor: pulse.actor,
    payload: pulse.payload,
    createdAt: new Date(pulse.createdAtMs),
  };
}

function createMatcher43(query: unknown): (pulse: StoredPulse43) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;
  const checks: Array<(pulse: StoredPulse43) => boolean> = [];
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

export class ReviewSandbox43 {
  private pulses: StoredPulse43[] = [];
  private nextId = 1;

  createPulse(lane: string, actor: string, payload: string): ReviewPulse43 {
    const pulse: StoredPulse43 = {
      id: this.nextId++,
      lane: normalizeText43(lane) || 'default-lane',
      actor: normalizeText43(actor) || 'unknown-actor',
      payload: normalizeText43(payload) || '[empty payload]',
      createdAtMs: Date.now(),
    };
    this.pulses.push(pulse);
    return snapshot43(pulse);
  }

  patchPulses(query: unknown, nextPayload: string): number {
    const replacement = normalizeText43(nextPayload);
    if (!replacement) return 0;
    const matches = createMatcher43(query);
    let changed = 0;
    this.pulses = this.pulses.map(pulse => {
      if (!matches(pulse)) return pulse;
      changed++;
      return { ...pulse, payload: replacement };
    });
    return changed;
  }
}
// Round-2 comment-only trigger for reviewer retesting.
// Round-3 comment-only trigger for reviewer retesting.
