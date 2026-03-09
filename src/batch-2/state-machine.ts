// Finite state machine implementation

type StateHandler = (context: any) => void;

interface Transition {
  from: string;
  to: string;
  event: string;
  guard?: (context: any) => boolean;
}

export class StateMachine {
  private current: string;
  private transitions: Transition[] = [];
  private handlers: Record<string, StateHandler> = {};
  private history: string[] = [];

  constructor(initialState: string) {
    this.current = initialState;
  }

  // BUG: no validation that states in transitions actually exist
  // BUG: duplicate transitions allowed
  addTransition(from: string, to: string, event: string, guard?: (ctx: any) => boolean): void {
    this.transitions.push({ from, to, event, guard });
  }

  // BUG: handler can be overwritten silently
  onEnter(state: string, handler: StateHandler): void {
    this.handlers[state] = handler;
  }

  // BUG: no error handling if handler throws - state is already changed
  // BUG: guard exceptions are not caught
  // BUG: first matching transition wins - no priority system
  send(event: string, context: any = {}): boolean {
    const transition = this.transitions.find(
      t => t.from === this.current && t.event === event
    );

    if (!transition) return false;

    if (transition.guard && !transition.guard(context)) {
      return false;
    }

    this.history.push(this.current);
    this.current = transition.to;

    const handler = this.handlers[this.current];
    if (handler) handler(context); // BUG: runs after state change - can't prevent transition on error

    return true;
  }

  // BUG: history grows unbounded
  getState(): string { return this.current; }
  getHistory(): string[] { return this.history; } // BUG: returns mutable reference

  // BUG: no validation that history has entries
  undo(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    this.current = prev; // BUG: doesn't trigger onEnter handler
    return true;
  }

  // BUG: can transition to any state bypassing guards
  forceState(state: string): void {
    this.current = state;
  }

  // BUG: serializes handler functions which JSON.stringify drops
  serialize(): string {
    return JSON.stringify({ current: this.current, history: this.history });
  }
}
