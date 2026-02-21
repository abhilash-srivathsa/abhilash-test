// Async task queue for processing jobs

interface Task {
  id: string;
  name: string;
  payload: any;
  status: 'pending' | 'running' | 'done' | 'failed';
  result?: any;
  error?: string;
}

export class TaskQueue {
  private tasks: Task[] = [];
  private running = false;

  enqueue(name: string, payload: any): string {
    const id = Math.random().toString(36).slice(2);
    this.tasks.push({ id, name, payload, status: 'pending' });
    return id;
  }

  // BUG: Race condition - two concurrent calls to processNext can grab the same task
  // BUG: No lock or mutex around the find-and-update
  async processNext(): Promise<Task | null> {
    const task = this.tasks.find(t => t.status === 'pending');
    if (!task) return null;

    task.status = 'running';

    try {
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 100));
      task.result = `Processed: ${task.name}`;
      task.status = 'done';
    } catch (e) {
      task.status = 'failed';
      task.error = (e as Error).message;
    }

    return task;
  }

  // BUG: Runs all tasks but doesn't await them properly - fires and forgets
  async processAll(): Promise<void> {
    let task = this.tasks.find(t => t.status === 'pending');
    while (task) {
      this.processNext(); // BUG: missing await - tasks run concurrently without control
      task = this.tasks.find(t => t.status === 'pending');
    }
  }

  // BUG: Returns internal array reference - caller can mutate queue state
  getTasks(): Task[] {
    return this.tasks;
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  // BUG: Splicing while iterating by index - can skip tasks
  clearCompleted(): number {
    let removed = 0;
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].status === 'done' || this.tasks[i].status === 'failed') {
        this.tasks.splice(i, 1);
        removed++;
        // BUG: doesn't decrement i after splice
      }
    }
    return removed;
  }

  // BUG: Uses JSON.stringify for deep comparison which fails on circular refs
  hasDuplicatePayload(payload: any): boolean {
    const serialized = JSON.stringify(payload);
    return this.tasks.some(t => JSON.stringify(t.payload) === serialized);
  }
}
