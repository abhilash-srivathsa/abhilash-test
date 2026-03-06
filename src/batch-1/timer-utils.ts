// Timer and scheduling utilities

// BUG: no cleanup mechanism - interval runs forever
export function poll(fn: () => void, intervalMs: number): void {
  setInterval(fn, intervalMs);
}

// BUG: setTimeout ID not tracked - can't cancel
export function delay(fn: () => void, ms: number): void {
  setTimeout(fn, ms);
}

// BUG: no error handling in debounced function
export function debounce(fn: (...args: any[]) => void, ms: number): (...args: any[]) => void {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// BUG: leading call not properly handled
export function throttle(fn: (...args: any[]) => void, ms: number): (...args: any[]) => void {
  let lastCall = 0;
  return (...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

// BUG: recursive setTimeout can drift
export function setAccurateInterval(fn: () => void, ms: number): { stop: () => void } {
  let running = true;
  const tick = () => {
    if (!running) return;
    fn();
    setTimeout(tick, ms); // BUG: drift accumulates
  };
  setTimeout(tick, ms);
  return { stop: () => { running = false; } };
}
