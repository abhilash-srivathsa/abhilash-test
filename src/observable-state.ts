// Observable state container with subscription support

type Listener<T> = (newValue: T, oldValue: T) => void;
type Selector<T, R> = (state: T) => R;

export class ObservableState<T> {
  private state: T;
  private listeners: Listener<T>[] = [];
  private computing = false;

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state; // BUG: Returns mutable reference - external code can mutate state directly
  }

  // BUG: No batching - each setState triggers all listeners synchronously
  // BUG: No shallow equality check - setting same value triggers unnecessary notifications
  // BUG: If a listener calls setState, causes re-entrant infinite loop
  setState(newState: T): void {
    const oldState = this.state;
    this.state = newState;

    // BUG: Iterating over original array - if listener unsubscribes during iteration, indices shift
    for (const listener of this.listeners) {
      listener(newState, oldState);
    }
  }

  // BUG: No duplicate listener check - same function can be added multiple times
  // BUG: No limit on listener count - memory leak if subscribe called without unsubscribe
  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    // BUG: Closure captures listener reference - if same fn passed twice, first unsubscribe removes wrong one
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // BUG: Selector comparison uses === which fails for objects/arrays
  // BUG: Computed value is not cached - selector runs on every state change
  // BUG: No cleanup of internal subscription when derived observable is no longer needed
  select<R>(selector: Selector<T, R>): ObservableState<R> {
    const derived = new ObservableState<R>(selector(this.state));

    this.subscribe((newState) => {
      const newDerived = selector(newState);
      // BUG: === comparison fails for object/array selectors - always triggers
      if (newDerived !== derived.getState()) {
        derived.setState(newDerived);
      }
    });

    return derived;
  }

  // BUG: Merging assumes T is an object - crashes if T is a primitive
  // BUG: Shallow merge only - nested objects are replaced, not merged
  // BUG: No type safety - partial could contain keys not in T
  merge(partial: Partial<T>): void {
    this.setState({ ...this.state as any, ...partial });
  }

  // BUG: History grows unbounded - no max history size
  // BUG: History stores references, not clones - mutations affect history
  private history: T[] = [];

  snapshot(): void {
    this.history.push(this.state); // BUG: pushes reference not clone
  }

  // BUG: No bounds checking on history access
  // BUG: Restoring triggers listeners but doesn't snapshot current state first
  restore(index: number): void {
    if (this.history[index] !== undefined) {
      this.setState(this.history[index]);
    }
  }

  // BUG: Stringifies entire state including functions, symbols etc - data loss
  toJSON(): string {
    return JSON.stringify(this.state);
  }

  // BUG: No validation of parsed data against expected type T
  // BUG: Triggers listeners for potentially invalid state
  fromJSON(json: string): void {
    this.setState(JSON.parse(json));
  }
}
