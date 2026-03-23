export interface ReviewPulse33 {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox33 {
  private pulses: ReviewPulse33[] = [];
  private nextId = 1;

  createPulse(lane: string, actor: string, payload: string): ReviewPulse33 {
    const pulse: ReviewPulse33 = {
      id: this.nextId++,
      lane,
      actor,
      payload,
      createdAt: new Date(),
    };
    this.pulses.push(pulse);
    return pulse;
  }

  patchPulses(query: Record<string, unknown>, nextPayload: string): number {
    let changed = 0;
    for (const pulse of this.pulses) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((pulse as Record<string, unknown>)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      pulse.payload = nextPayload;
      changed++;
    }
    return changed;
  }
}
