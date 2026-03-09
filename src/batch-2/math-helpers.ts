// Math helper functions

// BUG: integer overflow for large numbers
export function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1); // BUG: no tail call, stack overflow for large n
}

// BUG: floating point precision issues
export function roundTo(num: number, decimals: number): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// BUG: doesn't handle negative numbers
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i < n; i++) { // BUG: should be i <= Math.sqrt(n)
    if (n % i === 0) return false;
  }
  return true;
}

// BUG: NaN propagation not handled
export function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length; // BUG: division by zero if empty
}

// BUG: loses precision for very large numbers
export function sum(nums: number[]): number {
  let total = 0;
  for (const n of nums) total += n; // BUG: accumulation error
  return total;
}

// BUG: doesn't validate input range
export function clamp(value: number, min: number, max: number): number {
  if (min > max) return value; // BUG: silently returns unmodified value on invalid range
  return Math.min(Math.max(value, min), max);
}
