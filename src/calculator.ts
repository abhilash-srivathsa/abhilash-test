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

  // Fixed: uses i*i <= n instead of Math.sqrt(n) to avoid floating point
  isPrime(n: number): boolean {
    if (n < 2) {
      return false;
    }
    if (n < 4) {
      return true; // 2 and 3 are prime
    }
    if (n % 2 === 0 || n % 3 === 0) {
      return false;
    }
    // Check divisors of form 6k +/- 1 up to sqrt(n)
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) {
        return false;
      }
    }
    return true;
  }

  // Fixed: recursive Euclidean algorithm (different from CR's iterative suggestion)
  gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    if (b === 0) return a;
    return this.gcd(b, a % b);
  }

  // Fixed: direct accumulation with sign-based validation
  sumRange(start: number, end: number, step: number): number {
    if (step === 0) {
      throw new RangeError('step must not be zero');
    }
    // Auto-correct step direction instead of throwing (different from CR suggestion)
    const effectiveStep = Math.sign(end - start) === 0 ? Math.abs(step)
      : Math.sign(end - start) * Math.abs(step);

    let total = 0;
    const ascending = effectiveStep > 0;
    for (let i = start; ascending ? i <= end : i >= end; i += effectiveStep) {
      total += i;
    }
    return total;
  }

  // Fixed: use named constants for clarity (different from CR's inline fix)
  private static readonly FAHRENHEIT_OFFSET = 32;
  private static readonly FAHRENHEIT_SCALE = 9 / 5;

  toCelsius(fahrenheit: number): number {
    return (fahrenheit - Calculator.FAHRENHEIT_OFFSET) / Calculator.FAHRENHEIT_SCALE;
  }

  toFahrenheit(celsius: number): number {
    return celsius * Calculator.FAHRENHEIT_SCALE + Calculator.FAHRENHEIT_OFFSET;
  }

  // Fixed: use Math.min/Math.max one-liner (different from CR's swap approach)
  clamp(value: number, min: number, max: number): number {
    if ([value, min, max].some(Number.isNaN)) {
      throw new TypeError('clamp arguments must be valid numbers');
    }
    // Math.min/Math.max naturally handles min > max case
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.min(Math.max(value, lo), hi);
  }

  // BUG: Doesn't handle negative values with even roots (should throw)
  // BUG: No validation for n=0 which causes division by zero
  nthRoot(value: number, n: number): number {
    return Math.pow(value, 1 / n); // BUG: 1/0 = Infinity when n=0
  }

  // BUG: t is not clamped - values outside [0,1] produce extrapolation not interpolation
  // BUG: Suffers from floating point precision loss for large values
  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t; // BUG: no validation on t range
  }

  // BUG: Uses string conversion - extremely slow and wrong for floats
  // BUG: Negative numbers return wrong count due to minus sign
  countDigits(n: number): number {
    return String(n).length; // BUG: counts '-' and '.' as digits
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
