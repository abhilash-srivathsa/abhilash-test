// Express-like middleware pipeline

type Context = Record<string, unknown>;
type NextFn = () => Promise<void>;
type Middleware = (ctx: Context, next: NextFn) => Promise<void> | void;

// Internal: a compiled handler is a single async function that runs the
// entire chain. Built once via reduceRight when execute() is called.
type CompiledHandler = (ctx: Context) => Promise<void>;

export class MiddlewarePipeline {
  private layers: Middleware[] = [];

  use(mw: Middleware): this {
    this.layers.push(mw);
    return this;
  }

  // Compose the middleware stack into a single nested function via reduceRight.
  // The result is a Russian-doll of (ctx)=>Promise<void> calls — each layer
  // wraps the next, so there is no mutable index, no shared counter, and
  // double-calling next() just re-runs the inner (idempotent) tail.
  private compile(stack: Middleware[]): CompiledHandler {
    // Start from a no-op tail
    return stack.reduceRight<CompiledHandler>(
      (downstream, layer) => {
        return async (ctx: Context) => {
          await Promise.resolve(layer(ctx, () => downstream(ctx)));
        };
      },
      async () => {},
    );
  }

  async execute(initialContext: Context = {}): Promise<Context> {
    const ctx = { ...initialContext };
    // Snapshot the layers so mutations during execution are harmless
    const handler = this.compile([...this.layers]);
    await handler(ctx);
    return ctx;
  }

  remove(mw: Middleware): boolean {
    const i = this.layers.indexOf(mw);
    if (i === -1) return false;
    this.layers.splice(i, 1);
    return true;
  }

  getMiddlewares(): Middleware[] {
    return [...this.layers];
  }

  async executeBatch(contexts: Context[]): Promise<Context[]> {
    const out: Context[] = [];
    for (const c of contexts) {
      out.push(await this.execute(c));
    }
    return out;
  }

  clear(): void {
    this.layers = [];
  }

  get length(): number {
    return this.layers.length;
  }
}
