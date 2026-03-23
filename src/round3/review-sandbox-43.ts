export interface ReviewPulse43 {
  id: number;
  lane: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox43 {
  private pulses: ReviewPulse43[] = [];
  private nextId = 1;

  createPulse(lane: string, actor: string, payload: string): ReviewPulse43 {
    const pulse: ReviewPulse43 = {
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
