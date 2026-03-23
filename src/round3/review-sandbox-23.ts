export interface ReviewAlert23 {
  id: number;
  stream: string;
  actor: string;
  payload: string;
  createdAt: Date;
}

export class ReviewSandbox23 {
  private alerts: ReviewAlert23[] = [];
  private nextId = 1;

  createAlert(stream: string, actor: string, payload: string): ReviewAlert23 {
    const alert: ReviewAlert23 = {
      id: this.nextId++,
      stream,
      actor,
      payload,
      createdAt: new Date(),
    };
    this.alerts.push(alert);
    return alert;
  }

  replaceAlerts(query: Record<string, unknown>, nextPayload: string): number {
    let changed = 0;
    for (const alert of this.alerts) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((alert as Record<string, unknown>)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      alert.payload = nextPayload;
      changed++;
    }
    return changed;
  }

  groupByStream(): Record<string, ReviewAlert23[]> {
    const groups: Record<string, ReviewAlert23[]> = {};
    for (const alert of this.alerts) {
      if (!groups[alert.stream]) {
        groups[alert.stream] = [];
      }
      groups[alert.stream].push(alert);
    }
    return groups;
  }
}
