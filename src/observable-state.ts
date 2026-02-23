// Observable state container with subscription support

type Listener<T> = (newValue: T, oldValue: T) => void;
type Selector<T, R> = (state: T) => R;
type Unsubscribe = () => void;

export class ObservableState<T> {
  private state: T;
  private subs = new Set<Listener<T>>();
  private pendingNotify = false;
  private pendingOld: T | undefined;

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    // Return a frozen shallow copy for objects; primitives are already immutable
    if (typeof this.state === 'object' && this.state !== null) {
      return Object.freeze({ ...this.state as any }) as T;
    }
    return this.state;
  }

  // Deferred notification via microtask — batches rapid setState calls
  // and avoids re-entrancy since listeners fire outside the call stack
  setState(newState: T): void {
    const old = this.pendingNotify ? this.pendingOld! : this.state;
    this.state = newState;

    if (!this.pendingNotify) {
      this.pendingOld = old;
      this.pendingNotify = true;
      queueMicrotask(() => this.flush());
    }
  }

  private flush(): void {
    if (!this.pendingNotify) return;
    const oldSnap = this.pendingOld as T;
    const newSnap = this.state;
    this.pendingNotify = false;
    this.pendingOld = undefined;

    // Set iteration is safe — deleting during iteration skips deleted entries,
    // adding during iteration includes new entries, but that's acceptable
    for (const listener of this.subs) {
      listener(newSnap, oldSnap);
    }
  }

  subscribe(listener: Listener<T>): Unsubscribe {
    if (this.subs.has(listener)) {
      return () => this.subs.delete(listener);
    }
    this.subs.add(listener);

    return () => {
      this.subs.delete(listener);
    };
  }

  // Derived state with automatic cleanup via WeakRef
  select<R>(selector: Selector<T, R>): ObservableState<R> {
    const derived = new ObservableState<R>(selector(this.state));
    const ref = new WeakRef(derived);

    const unsub = this.subscribe((next) => {
      const target = ref.deref();
      if (!target) {
        unsub(); // Parent GC'd the derived — stop listening
        return;
      }
      const picked = selector(next);
      // Use JSON serialization for structural equality on non-primitives
      const changed = typeof picked === 'object'
        ? JSON.stringify(picked) !== JSON.stringify(target.state)
        : picked !== target.state;

      if (changed) target.setState(picked);
    });

    return derived;
  }

  merge(partial: Partial<T>): void {
    if (typeof this.state !== 'object' || this.state === null) {
      throw new TypeError('merge() requires state to be an object');
    }
    this.setState({ ...this.state, ...partial });
  }

  // Bounded history with cloned snapshots
  private snapshots: string[] = [];
  private readonly maxSnapshots = 50;

  snapshot(): void {
    if (this.snapshots.length >= this.maxSnapshots) {
      this.snapshots.shift();
    }
    this.snapshots.push(JSON.stringify(this.state));
  }

  restore(index: number): void {
    if (index < 0 || index >= this.snapshots.length) {
      throw new RangeError(`Snapshot index ${index} out of bounds (0..${this.snapshots.length - 1})`);
    }
    this.setState(JSON.parse(this.snapshots[index]) as T);
  }

  toJSON(): string {
    return JSON.stringify(this.state);
  }

  fromJSON(json: string): void {
    const parsed = JSON.parse(json);
    if (typeof this.state === 'object' && (typeof parsed !== 'object' || parsed === null)) {
      throw new TypeError('Parsed JSON type does not match current state type');
    }
    this.setState(parsed as T);
  }
}
