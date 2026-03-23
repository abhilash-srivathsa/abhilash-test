export interface ReviewSignal30 {
  id: number;
  lane: string;
  reporter: string;
  message: string;
  createdAt: Date;
}

export class ReviewSandbox30 {
  private signals: ReviewSignal30[] = [];
  private nextId = 1;

  createSignal(lane: string, reporter: string, message: string): ReviewSignal30 {
    const signal: ReviewSignal30 = {
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

  importSignals(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.signals.push({
        id: this.nextId++,
        lane: String(item.lane),
        reporter: String(item.reporter),
        message: String(item.message),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }
}
