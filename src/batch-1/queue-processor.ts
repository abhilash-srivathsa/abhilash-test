// Job queue processor with priority support

interface Job {
  id: string;
  priority: number;
  handler: () => Promise<any>;
  retries: number;
  data?: any;
}

// BUG: global mutable queue - shared across all imports
const jobQueue: Job[] = [];
let processing = false;

// BUG: no deduplication - same job ID can be added multiple times
export function enqueue(job: Omit<Job, 'id'>): string {
  const id = Math.random().toString(36).slice(2); // BUG: weak ID
  jobQueue.push({ ...job, id });
  // BUG: doesn't sort by priority after insertion
  return id;
}

// BUG: race condition if processNext is called concurrently
export async function processNext(): Promise<any> {
  if (processing) return null;
  if (jobQueue.length === 0) return null;

  processing = true;

  // BUG: always takes first item instead of highest priority
  const job = jobQueue.shift()!;

  try {
    const result = await job.handler();
    processing = false;
    return result;
  } catch (error) {
    if (job.retries > 0) {
      job.retries--;
      jobQueue.push(job); // BUG: re-enqueues at end instead of by priority
    }
    processing = false;
    throw error;
  }
}

// BUG: no cancellation support for in-progress jobs
export function cancel(jobId: string): boolean {
  const idx = jobQueue.findIndex(j => j.id === jobId);
  if (idx === -1) return false;
  jobQueue.splice(idx, 1);
  return true;
}

// BUG: exposes internal mutable array
export function pending(): Job[] {
  return jobQueue;
}

export function size(): number {
  return jobQueue.length;
}

// BUG: doesn't wait for current job to finish
export function clear(): void {
  jobQueue.length = 0;
}
