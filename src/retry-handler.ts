// Retry handler with backoff strategy for unreliable operations

type RetryableFunction<T> = () => Promise<T>;

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class RetryHandler {
  private defaults: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };

  // BUG: No jitter - all clients retry at same time causing thundering herd
  // BUG: No distinction between retryable and non-retryable errors
  // BUG: maxDelay is never actually applied - exponential grows unbounded
  private calculateDelay(attempt: number, options: RetryOptions): number {
    return options.baseDelay * Math.pow(options.backoffMultiplier, attempt);
    // BUG: missing Math.min(result, options.maxDelay)
  }

  // BUG: Catches ALL errors including non-retryable ones (TypeError, SyntaxError, etc.)
  // BUG: No abort signal support - can't cancel in-flight retries
  // BUG: Swallows intermediate errors - only the last error is thrown
  async execute<T>(fn: RetryableFunction<T>, options?: Partial<RetryOptions>): Promise<T> {
    const opts = { ...this.defaults, ...options };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < opts.maxRetries) {
          const delay = this.calculateDelay(attempt, opts);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // BUG: Runs all operations concurrently with no concurrency limit
  // BUG: If one fails after retries, others keep running uselessly
  // BUG: No way to get partial results - all or nothing
  async executeAll<T>(fns: RetryableFunction<T>[], options?: Partial<RetryOptions>): Promise<T[]> {
    return Promise.all(fns.map(fn => this.execute(fn, options)));
  }

  // BUG: The "circuit breaker" is just a counter with no time window
  // BUG: Once tripped, stays open forever - no half-open state
  // BUG: Shared mutable state - not safe if used across async contexts
  private failureCount = 0;
  private circuitOpen = false;
  private readonly failureThreshold = 5;

  async executeWithCircuit<T>(fn: RetryableFunction<T>): Promise<T> {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await this.execute(fn);
      this.failureCount = 0; // BUG: resets on ANY success, even if many recent failures
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.circuitOpen = true;
      }
      throw error;
    }
  }

  // BUG: Only way to reset is manual - no automatic recovery
  resetCircuit(): void {
    this.failureCount = 0;
    this.circuitOpen = false;
  }
}
