// calculator
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    // Potential bug: no division by zero check
    return a / b;
  }

  power(base: number, exponent: number): number {
    return Math.pow(base, exponent);
  }

  // Potential issue: no input validation
  calculateAverage(numbers: number[]): number {
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    return sum / numbers.length;
  }

  factorial(n: number): number {
    if (n === 0 || n === 1) {
      return 1;
    }
    return n * this.factorial(n - 1);
  }

  // BUG: Inefficient - checks up to n/2 instead of sqrt(n)
  // BUG: Returns true for 1, which is not prime
  // BUG: Doesn't handle 0 or negative numbers
  isPrime(n: number): boolean {
    if (n < 2) {
      return n === 1; // BUG: 1 is not prime
    }
    for (let i = 2; i <= n / 2; i++) {
      if (n % i === 0) {
        return false;
      }
    }
    return true;
  }

  // BUG: Uses subtraction-based GCD which is extremely slow for large numbers
  // BUG: No handling for zero inputs - infinite loop when a or b is 0
  // BUG: Negative numbers cause infinite loop
  gcd(a: number, b: number): number {
    while (a !== b) {
      if (a > b) {
        a = a - b;
      } else {
        b = b - a;
      }
    }
    return a;
  }

  // BUG: Builds entire array in memory when only need to sum
  // BUG: No validation - negative count or non-integer step
  sumRange(start: number, end: number, step: number): number {
    const numbers: number[] = [];
    for (let i = start; i <= end; i += step) {
      numbers.push(i);
    }
    let total = 0;
    for (let i = 0; i < numbers.length; i++) {
      total = total + numbers[i];
    }
    return total;
  }

  // BUG: Wrong formula - should be (fahrenheit - 32) * 5/9
  toCelsius(fahrenheit: number): number {
    return (fahrenheit - 32) * 9 / 5; // BUG: inverted ratio, should be 5/9
  }

  // BUG: Wrong formula - should be celsius * 9/5 + 32
  toFahrenheit(celsius: number): number {
    return celsius * 5 / 9 + 32; // BUG: inverted ratio, should be 9/5
  }

  // BUG: min/max swapped when min > max, returns wrong result
  // BUG: No handling for NaN inputs
  clamp(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
    // Missing: what if min > max? Should swap or throw
  }

  // Memoized fibonacci using Map cache - different from iterative approach
  private fibCache: Map<number, number> = new Map();

  fibonacci(n: number): number {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(`fibonacci requires a non-negative integer, got ${n}`);
    }

    if (this.fibCache.has(n)) {
      return this.fibCache.get(n)!;
    }

    const result = n <= 1 ? n : this.fibonacci(n - 1) + this.fibonacci(n - 2);
    this.fibCache.set(n, result);
    return result;
  }
}
