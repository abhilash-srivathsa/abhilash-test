// Retry handler with backoff strategy for unreliable operations

type RetryableFunction<T> = () => Promise<T>;

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  isRetryable?: (err: Error) => boolean;
}

interface FailureRecord {
  timestamp: number;
}

export class RetryHandler {
  private defaults: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };

  // Decorrelated jitter — delay is random between baseDelay and previous * 3
  // This spreads clients across a wider range than equal/full jitter
  private prevDelay = 0;

  private calculateDelay(attempt: number, options: RetryOptions): number {
    if (attempt === 0) {
      this.prevDelay = options.baseDelay;
      return options.baseDelay;
    }
    const lo = options.baseDelay;
    const hi = Math.min(options.maxDelay, this.prevDelay * options.backoffMultiplier * 1.5);
    const jittered = lo + Math.random() * (hi - lo);
    this.prevDelay = jittered;
    return Math.round(jittered);
  }

  async execute<T>(fn: RetryableFunction<T>, options?: Partial<RetryOptions>): Promise<T> {
    const opts = { ...this.defaults, ...options };
    const shouldRetry = opts.isRetryable ?? ((e: Error) => {
      // Don't retry programmer errors
      return !(e instanceof TypeError || e instanceof SyntaxError || e instanceof ReferenceError);
    });

    const errors: Error[] = [];

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);

        if (attempt >= opts.maxRetries || !shouldRetry(err)) {
          const final = new Error(`Failed after ${attempt + 1} attempt(s): ${err.message}`);
          (final as any).attempts = errors;
          throw final;
        }

        const delay = this.calculateDelay(attempt, opts);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw errors[errors.length - 1];
  }

  // Sequential with early abort — if one permanently fails, skip the rest
  async executeAll<T>(fns: RetryableFunction<T>[], options?: Partial<RetryOptions>): Promise<T[]> {
    const results: T[] = [];
    for (const fn of fns) {
      results.push(await this.execute(fn, options));
    }
    return results;
  }

  // Sliding-window circuit breaker — tracks recent failures by timestamp
  private failures: FailureRecord[] = [];
  private consecutiveSuccesses = 0;
  private circuitState: 'closed' | 'open' = 'closed';
  private readonly failureThreshold = 5;
  private readonly failureWindowMs = 60_000;       // 1 minute window
  private readonly successesToClose = 3;            // need N successes to re-close

  private recentFailureCount(): number {
    const cutoff = Date.now() - this.failureWindowMs;
    // Prune old entries while counting
    this.failures = this.failures.filter(f => f.timestamp > cutoff);
    return this.failures.length;
  }

  async executeWithCircuit<T>(fn: RetryableFunction<T>): Promise<T> {
    if (this.circuitState === 'open') {
      // Allow probe attempts — if enough consecutive successes, close circuit
      try {
        const result = await fn();
        this.consecutiveSuccesses++;
        if (this.consecutiveSuccesses >= this.successesToClose) {
          this.circuitState = 'closed';
          this.failures = [];
          this.consecutiveSuccesses = 0;
        }
        return result;
      } catch (error) {
        this.consecutiveSuccesses = 0;
        this.failures.push({ timestamp: Date.now() });
        throw error;
      }
    }

    try {
      const result = await this.execute(fn);
      this.consecutiveSuccesses++;
      return result;
    } catch (error) {
      this.consecutiveSuccesses = 0;
      this.failures.push({ timestamp: Date.now() });

      if (this.recentFailureCount() >= this.failureThreshold) {
        this.circuitState = 'open';
      }
      throw error;
    }
  }

  resetCircuit(): void {
    this.failures = [];
    this.consecutiveSuccesses = 0;
    this.circuitState = 'closed';
  }
}
