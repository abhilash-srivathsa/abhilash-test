// Promise pool for controlled concurrency

type Task<T> = () => Promise<T>;

export class PromisePool<T> {
  private queue: Task<T>[] = [];
  private running = 0;
  private concurrency: number;
  private results: T[] = [];

  // BUG: no validation on concurrency - 0 means nothing ever runs
  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  // BUG: tasks can't be cancelled once added
  add(task: Task<T>): void {
    this.queue.push(task);
  }

  // BUG: errors from one task reject everything - no partial results
  // BUG: results array order doesn't match task submission order
  async run(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const next = () => {
        if (this.queue.length === 0 && this.running === 0) {
          resolve(this.results);
          return;
        }

        while (this.running < this.concurrency && this.queue.length > 0) {
          const task = this.queue.shift()!;
          this.running++;
          task()
            .then(result => {
              this.results.push(result); // BUG: push order is completion order not submission
              this.running--;
              next();
            })
            .catch(err => {
              reject(err); // BUG: doesn't wait for running tasks to finish
            });
        }
      };
      next();
    });
  }

  // BUG: returns stale count if called during run()
  get pending(): number {
    return this.queue.length;
  }

  // BUG: clears queue but running tasks continue
  clear(): void {
    this.queue = [];
  }

  // BUG: results from previous run() leak into next
  get completedCount(): number {
    return this.results.length;
  }
}
