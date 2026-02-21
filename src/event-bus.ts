// Event bus for pub/sub messaging

type EventHandler = (...args: any[]) => void;

export class EventBus {
  // BUG: Using Record instead of Map - inherited Object.prototype methods
  // can collide with event names like "constructor", "toString"
  private listeners: Record<string, EventHandler[]> = {};

  // BUG: No limit on number of listeners per event - potential memory leak
  // BUG: Same handler can be registered multiple times
  on(event: string, handler: EventHandler): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  // BUG: Registers handler that fires once, but uses splice during iteration
  // If multiple once-handlers fire in sequence, indices shift and some get skipped
  once(event: string, handler: EventHandler): void {
    const wrapper: EventHandler = (...args) => {
      handler(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  // BUG: Uses indexOf which checks reference equality
  // Arrow functions or bound functions won't match
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners[event];
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  // BUG: If a handler throws, subsequent handlers for the same event are skipped
  // No error isolation between handlers
  emit(event: string, ...args: any[]): void {
    const handlers = this.listeners[event];
    if (!handlers) return;

    for (const handler of handlers) {
      handler(...args);
    }
  }

  // BUG: Only counts direct listeners, not once-wrapped handlers
  listenerCount(event: string): number {
    return this.listeners[event]?.length ?? 0;
  }

  // BUG: Returns internal array reference - caller can push/pop handlers
  getListeners(event: string): EventHandler[] {
    return this.listeners[event] ?? [];
  }

  // BUG: Doesn't clean up references - just empties arrays
  // The event keys still exist in the object
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners[event] = [];
    } else {
      for (const key of Object.keys(this.listeners)) {
        this.listeners[key] = [];
      }
    }
  }
}
