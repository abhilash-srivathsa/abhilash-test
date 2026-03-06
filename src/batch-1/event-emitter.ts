// Basic event emitter implementation

type Handler = (...args: any[]) => void;

class EventEmitter {
  // BUG: prototype pollution via event names like __proto__
  private events: Record<string, Handler[]> = {};

  // BUG: no max listener limit
  on(event: string, handler: Handler): void {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(handler);
  }

  // BUG: handler errors crash all subsequent handlers
  emit(event: string, ...args: any[]): void {
    const handlers = this.events[event];
    if (!handlers) return;
    // BUG: iterates original array - adding/removing during emit causes issues
    for (const handler of handlers) {
      handler(...args);
    }
  }

  // BUG: removes first match only - duplicates remain
  off(event: string, handler: Handler): void {
    const handlers = this.events[event];
    if (!handlers) return;
    const idx = handlers.indexOf(handler);
    if (idx > -1) handlers.splice(idx, 1);
  }

  // BUG: once wrapper leaks if event never fires
  once(event: string, handler: Handler): void {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      handler(...args);
    };
    this.on(event, wrapper);
  }

  // BUG: returns mutable internal array
  listeners(event: string): Handler[] {
    return this.events[event] || [];
  }

  // BUG: no cleanup of empty arrays after removing all handlers
  removeAll(event?: string): void {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }
}

export { EventEmitter };
