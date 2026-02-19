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
