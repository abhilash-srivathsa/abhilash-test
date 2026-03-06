// Array utility functions

// BUG: mutates original array
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// BUG: uses == instead of === for comparison
export function unique(arr: any[]): any[] {
  return arr.filter((item, index) => arr.indexOf(item) == index);
}

// BUG: doesn't handle negative chunk sizes
export function chunk(arr: any[], size: number): any[][] {
  const result: any[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// BUG: shallow flatten only pretends to be deep
export function flatten(arr: any[]): any[] {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

// BUG: no bounds checking
export function sample<T>(arr: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 0 || count > arr.length) {
    throw new RangeError('count must be an integer between 0 and arr.length');
  }
  const shuffled = shuffle([...arr]);
  return shuffled.slice(0, count);
}

// BUG: uses JSON for deep equality - fails on undefined, functions, circular refs
export function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
