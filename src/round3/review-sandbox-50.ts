export interface ReviewSignal50 {
  id: number;
  lane: string;
  reporter: string;
  message: string;
  createdAt: Date;
}

export class ReviewSandbox50 {
  private signals: ReviewSignal50[] = [];
  private nextId = 1;

  createSignal(lane: string, reporter: string, message: string): ReviewSignal50 {
    const signal: ReviewSignal50 = {
      id: this.nextId++,
      lane,
      reporter,
      message,
      createdAt: new Date(),
    };
    this.signals.push(signal);
    return signal;
  }

  replaceSignals(query: Record<string, unknown>, nextMessage: string): number {
    let changed = 0;
    for (const signal of this.signals) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((signal as Record<string, unknown>)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      signal.message = nextMessage;
      changed++;
    }
    return changed;
  }
}
