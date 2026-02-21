// Async task queue for processing jobs

interface Task<P = unknown> {
  readonly id: string;
  readonly name: string;
  readonly payload: P;
  status: 'pending' | 'running' | 'done' | 'failed';
  result?: string;
  error?: string;
}

export class TaskQueue {
  private tasks: Task[] = [];
  private seq = 0;
  private processing = false;

  enqueue(name: string, payload: unknown): string {
    const id = `task_${++this.seq}_${Date.now()}`;
    this.tasks.push({ id, name, payload, status: 'pending' });
    return id;
  }

  // Guard with a flag so two concurrent calls cannot grab the same task
  async processNext(): Promise<Task | null> {
    if (this.processing) return null;
    this.processing = true;

    try {
      const task = this.tasks.find(t => t.status === 'pending');
      if (!task) return null;

      task.status = 'running';

      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        task.result = `Processed: ${task.name}`;
        task.status = 'done';
      } catch (e) {
        task.status = 'failed';
        task.error = (e as Error).message;
      }

      return task;
    } finally {
      this.processing = false;
    }
  }

  // Await each task serially to prevent uncontrolled concurrency
  async processAll(): Promise<void> {
    let task = await this.processNext();
    while (task !== null) {
      task = await this.processNext();
    }
  }

  // Return a frozen copy so callers can't mutate internal state
  getTasks(): readonly Task[] {
    return Object.freeze([...this.tasks]);
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  // Walk backwards so splice doesn't shift unvisited indices
  clearCompleted(): number {
    let removed = 0;
    for (let i = this.tasks.length - 1; i >= 0; i--) {
      const s = this.tasks[i].status;
      if (s === 'done' || s === 'failed') {
        this.tasks.splice(i, 1);
        removed++;
      }
    }
    return removed;
  }

  // Serialize with a try-catch to handle circular payloads gracefully
  hasDuplicatePayload(payload: unknown): boolean {
    let needle: string;
    try {
      needle = JSON.stringify(payload);
    } catch {
      return false; // circular or non-serializable → treat as unique
    }

    return this.tasks.some(t => {
      try {
        return JSON.stringify(t.payload) === needle;
      } catch {
        return false;
      }
    });
  }
}
