// Express-like middleware pipeline

type Context = Record<string, unknown>;
type NextFn = () => Promise<void>;
type Middleware = (ctx: Context, next: NextFn) => Promise<void> | void;

interface MiddlewareError {
  index: number;
  error: Error;
}

export class MiddlewarePipeline {
  private stack: Middleware[] = [];

  use(middleware: Middleware): this {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.stack.push(middleware);
    return this;
  }

  // Linear loop — no recursive next() closure, no index mutation issues
  // Each middleware runs in sequence; if it wants to "skip", it simply returns
  async execute(initialContext: Context = {}): Promise<Context> {
    const ctx = { ...initialContext }; // shallow copy for isolation
    const errors: MiddlewareError[] = [];
    const snapshot = Array.from(this.stack); // freeze against mid-run mutations

    for (let i = 0; i < snapshot.length; i++) {
      let nextCalled = false;

      const next: NextFn = async () => {
        nextCalled = true;
      };

      try {
        await Promise.resolve(snapshot[i](ctx, next));
      } catch (err) {
        errors.push({
          index: i,
          error: err instanceof Error ? err : new Error(String(err)),
        });
        break; // stop pipeline on first error
      }

      // If middleware didn't call next(), halt the chain (intentional short-circuit)
      if (!nextCalled) break;
    }

    if (errors.length > 0) {
      const e = errors[0];
      const wrapper = new Error(`Pipeline halted at middleware[${e.index}]: ${e.error.message}`);
      (wrapper as any).cause = e.error;
      throw wrapper;
    }

    return ctx;
  }

  remove(middleware: Middleware): boolean {
    const idx = this.stack.indexOf(middleware);
    if (idx === -1) return false;
    this.stack.splice(idx, 1);
    return true;
  }

  getMiddlewares(): readonly Middleware[] {
    return Object.freeze([...this.stack]);
  }

  // Run batch sequentially — each context is independent
  async executeBatch(contexts: Context[]): Promise<Context[]> {
    const results: Context[] = [];
    for (const ctx of contexts) {
      results.push(await this.execute(ctx));
    }
    return results;
  }

  clear(): void {
    this.stack = [];
  }

  get length(): number {
    return this.stack.length;
  }
}
