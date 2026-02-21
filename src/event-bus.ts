// Event bus for pub/sub messaging

type EventHandler = (...args: unknown[]) => void;

const MAX_LISTENERS_PER_EVENT = 100;

export class EventBus {
  // Prototype-free object eliminates collisions with toString, constructor, etc.
  private channels: { [event: string]: EventHandler[] } = Object.create(null);

  private ensureChannel(event: string): EventHandler[] {
    if (!(event in this.channels)) {
      this.channels[event] = [];
    }
    return this.channels[event];
  }

  on(event: string, handler: EventHandler): void {
    const ch = this.ensureChannel(event);
    if (ch.length >= MAX_LISTENERS_PER_EVENT) {
      throw new Error(`Listener limit (${MAX_LISTENERS_PER_EVENT}) reached for "${event}"`);
    }
    if (ch.includes(handler)) return; // prevent duplicate registration
    ch.push(handler);
  }

  once(event: string, handler: EventHandler): void {
    const self = this;
    function oneShot(this: unknown, ...args: unknown[]): void {
      self.off(event, oneShot);
      handler.apply(this, args);
    }
    // Stash original so off() can match by original reference too
    (oneShot as any).__wrapped = handler;
    this.on(event, oneShot);
  }

  off(event: string, handler: EventHandler): void {
    if (!(event in this.channels)) return;
    const ch = this.channels[event];
    const idx = ch.findIndex(
      (h) => h === handler || (h as any).__wrapped === handler,
    );
    if (idx >= 0) ch.splice(idx, 1);
  }

  // Run every handler; collect errors and throw aggregate after all have run
  emit(event: string, ...args: unknown[]): void {
    if (!(event in this.channels)) return;

    // Snapshot so mutations during emit don't affect iteration
    const snapshot = Array.from(this.channels[event]);
    const errors: Error[] = [];

    for (const handler of snapshot) {
      try {
        handler(...args);
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
    }

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, `${errors.length} handler(s) failed for "${event}"`);
    }
  }

  listenerCount(event: string): number {
    if (!(event in this.channels)) return 0;
    return this.channels[event].length;
  }

  // Return a shallow copy so the caller cannot mutate internal state
  getListeners(event: string): EventHandler[] {
    if (!(event in this.channels)) return [];
    return Array.from(this.channels[event]);
  }

  removeAllListeners(event?: string): void {
    if (event !== undefined) {
      delete this.channels[event];
    } else {
      // Wipe entire object by recreating prototype-free store
      this.channels = Object.create(null);
    }
  }
}
