// Express-like middleware pipeline

type Context = Record<string, any>;
type NextFn = () => Promise<void>;
type Middleware = (ctx: Context, next: NextFn) => Promise<void> | void;

export class MiddlewarePipeline {
  private stack: Middleware[] = [];

  // BUG: No duplicate check - same middleware can be added multiple times
  // BUG: No validation that middleware is a function
  use(middleware: Middleware): this {
    this.stack.push(middleware);
    return this;
  }

  // BUG: Shared mutable context between all middlewares - no isolation
  // BUG: If a middleware doesn't call next(), remaining middlewares silently skipped
  // BUG: No timeout - a hanging middleware blocks the entire pipeline forever
  // BUG: Error in one middleware kills the chain with no cleanup
  async execute(initialContext: Context = {}): Promise<Context> {
    const ctx = initialContext;
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.stack.length) return;

      const middleware = this.stack[index];
      index++;

      // BUG: If middleware returns a non-promise, errors aren't caught
      // BUG: No try-catch means one middleware failure kills everything
      await middleware(ctx, next);
    };

    await next();
    return ctx;
  }

  // BUG: Removes by reference - won't work for anonymous functions
  remove(middleware: Middleware): boolean {
    const idx = this.stack.indexOf(middleware);
    if (idx === -1) return false;
    this.stack.splice(idx, 1);
    return true;
  }

  // BUG: Returns internal array reference
  getMiddlewares(): Middleware[] {
    return this.stack;
  }

  // BUG: Executes all pipelines concurrently sharing same context
  // If pipelines modify ctx, race conditions happen
  async executeBatch(contexts: Context[]): Promise<Context[]> {
    return Promise.all(contexts.map(ctx => this.execute(ctx)));
  }

  // BUG: Clearing while execute is running leaves dangling references
  clear(): void {
    this.stack.length = 0;
  }

  get length(): number {
    return this.stack.length;
  }
}
