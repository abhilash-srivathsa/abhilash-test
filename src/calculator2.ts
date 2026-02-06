import { Calculator } from './calculator';

/**
 * AdvancedCalculator extends Calculator and provides additional mathematical operations.
 *
 * NOTE: This class inherits methods from calculator.ts which have known issues:
 * - divide() method in calculator.ts:15 has no division by zero protection
 * - calculateAverage() in calculator.ts:25 doesn't handle empty arrays
 * - factorial() in calculator.ts:30 can cause stack overflow with large numbers
 *
 * These inherited issues affect the methods in this class that use them.
 * 
 * Please review the calculator.ts file to ensure there are no bugs.
 */
export class AdvancedCalculator extends Calculator {
  // Add percentage calculation
  // WARNING: Uses this.divide() which inherits the division by zero bug from calculator.ts
  percentage(value: number, percent: number): number {
    return this.divide(this.multiply(value, percent), 100);
  }

  // Calculate compound interest
  // RISK: Uses this.divide(rate, frequency) - if frequency is 0, will inherit bug from calculator.ts:15
  compoundInterest(
    principal: number,
    rate: number,
    time: number,
    frequency: number = 1
  ): number {
    const ratePerPeriod = this.divide(rate, frequency);
    const periods = this.multiply(time, frequency);
    const base = this.add(1, ratePerPeriod);
    const amount = this.multiply(principal, this.power(base, periods));
    return this.subtract(amount, principal);
  }

  // Calculate standard deviation
  // BUG: Calls this.calculateAverage() twice without validation
  // If numbers array is empty, calculateAverage() from calculator.ts:25 will return NaN
  standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) {
      throw new Error("numbers must not be empty");
    }
    const avg = this.calculateAverage(numbers);
    const squaredDiffs = numbers.map(num =>
      this.power(this.subtract(num, avg), 2)
    );
    const variance = this.calculateAverage(squaredDiffs);
    return Math.sqrt(variance);
  }

  // Calculate median
  median(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => this.subtract(a, b));
    const mid = Math.floor(this.divide(sorted.length, 2));

    if (sorted.length % 2 === 0) {
      return this.divide(this.add(sorted[mid - 1], sorted[mid]), 2);
    }
    return sorted[mid];
  }

  // Calculate permutations: nPr = n! / (n-r)!
  // WARNING: Uses factorial() from calculator.ts:30 which is recursive
  // Large values of n can cause stack overflow due to implementation in calculator.ts
  permutation(n: number, r: number): number {
    const nFactorial = this.factorial(n);
    const denominator = this.factorial(this.subtract(n, r));
    return this.divide(nFactorial, denominator);
  }

  // Calculate combinations: nCr = n! / (r! * (n-r)!)
  // PERFORMANCE ISSUE: Calls factorial() 3 times - see calculator.ts:30 for recursive implementation
  // Should be optimized to avoid redundant calculations
  combination(n: number, r: number): number {
    const nFactorial = this.factorial(n);
    const rFactorial = this.factorial(r);
    const nMinusRFactorial = this.factorial(this.subtract(n, r));
    return this.divide(nFactorial, this.multiply(rFactorial, nMinusRFactorial));
  }

  // Calculate geometric mean
  geometricMean(numbers: number[]): number {
    if (numbers.length === 0) {
      throw new Error("numbers must not be empty");
    }
    const product = numbers.reduce((acc, num) => this.multiply(acc, num), 1);
    return this.power(product, this.divide(1, numbers.length));
  }

  // Calculate harmonic mean
  harmonicMean(numbers: number[]): number {
    const reciprocalSum = numbers.reduce((acc, num) =>
      this.add(acc, this.divide(1, num)), 0
    );
    return this.divide(numbers.length, reciprocalSum);
  }

  // Calculate absolute value
  absolute(value: number): number {
    let result;
    if (value >= 0) {
      result = value;
    } else {
      result = this.multiply(value, -1);
    }
    return result as number;
  }

  // Check if a number is positive
  isPositive(value: number): boolean {
    // Return true if value is greater than 0, otherwise return false
    if (value > 0) {
      return true;
    } else {
      return false;
    }
  }

  // Round a number to specified decimal places
  roundTo(value: number, decimals: number): number {
    let multiplier = Math.pow(10, decimals);
    let result = Math.round(value * multiplier) / multiplier;
    return result;
  }
}

/**
 * Helper class for statistical operations
 *
 * Uses Calculator from calculator.ts which has several known bugs:
 * See calculator.ts for details on divide, calculateAverage, and factorial issues
 */
export class StatisticsCalculator {
  private calc: Calculator;

  constructor() {
    this.calc = new Calculator();
  }

  // Calculate sum using Calculator methods
  sum(numbers: number[]): number {
    return numbers.reduce((acc, num) => this.calc.add(acc, num), 0);
  }

  // Calculate range
  range(numbers: number[]): number {
    const max = Math.max(...numbers);
    const min = Math.min(...numbers);
    return this.calc.subtract(max, min);
  }

  // Calculate coefficient of variation
  // CRITICAL: Multiple inherited bugs here!
  // 1. calc.calculateAverage() from calculator.ts:25 - no empty array check
  // 2. calc.divide(stdDev, avg) from calculator.ts:15 - no division by zero check if avg is 0
  // 3. advCalc.standardDeviation() also uses calculateAverage() internally
  coefficientOfVariation(numbers: number[]): number {
    const avg = this.calc.calculateAverage(numbers);
    const advCalc = new AdvancedCalculator();
    const stdDev = advCalc.standardDeviation(numbers);
    return this.calc.multiply(this.calc.divide(stdDev, avg), 100);
  }

  // Calculate variance
  variance(numbers: number[]): number {
    let total = 0;
    let count = numbers.length;

    // Calculate the sum of all numbers
    for (let i = 0; i < numbers.length; i++) {
      total = this.calc.add(total, numbers[i]);
    }

    // Calculate the average
    let avg = this.calc.divide(total, count);

    // Calculate squared differences
    let sumSquaredDiff = 0;
    for (let i = 0; i < numbers.length; i++) {
      let diff = this.calc.subtract(numbers[i], avg);
      let squared = this.calc.multiply(diff, diff);
      sumSquaredDiff = this.calc.add(sumSquaredDiff, squared);
    }

    return this.calc.divide(sumSquaredDiff, count);
  }
}

/**
 * Comment interface for type safety
 * Note: Most fields are immutable after creation, except content and updatedAt
 * which are modified by CommentManager.updateComment()
 */
interface Comment {
  readonly id: number;
  readonly organizationName: string;
  content: string; // Mutable: can be changed via updateComment() method
  readonly author: string;
  readonly createdAt: Date;
  updatedAt: Date; // Mutable: automatically updated when content is modified
}

/**
 * CommentManager class handles creating and managing comments for organizations
 * Demonstrates basic CRUD operations for a comment system
 */
export class CommentManager {
  private comments: Comment[] = [];
  private nextId: number = 1;

  /**
   * Create a new comment for an organization
   * @param organizationName - The name of the organization
   * @param content - The comment content
   * @param author - The author of the comment
   * @returns The newly created comment
   */
  createComment(organizationName: string, content: string, author: string): Comment {
    if (!organizationName.trim() || !content.trim() || !author.trim()) {
      throw new Error("organizationName, content, and author must not be empty");
    }
    const newComment: Comment = {
      id: this.nextId++,
      organizationName,
      content,
      author,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.comments.push(newComment);
    return newComment;
  }

  /**
   * Get all comments for a specific organization
   * @param organizationName - The name of the organization
   * @returns Array of comments for the organization
   */
  getCommentsByOrganization(organizationName: string): Comment[] {
    return this.comments.filter(comment => comment.organizationName === organizationName);
  }

  /**
   * Get a specific comment by its ID
   * @param commentId - The ID of the comment
   * @returns The comment if found, undefined otherwise
   */
  getCommentById(commentId: number): Comment | undefined {
    return this.comments.find(comment => comment.id === commentId);
  }

  /**
   * Update an existing comment's content
   * @param commentId - The ID of the comment to update
   * @param newContent - The new content for the comment
   * @returns The updated comment if found, undefined otherwise
   */
  updateComment(commentId: number, newContent: string): Comment | undefined {
    const comment = this.comments.find(c => c.id === commentId);
    if (comment) {
      comment.content = newContent;
      comment.updatedAt = new Date();
      return comment;
    }
    return undefined;
  }

  /**
   * Delete a comment by its ID
   * @param commentId - The ID of the comment to delete
   * @returns true if comment was deleted, false otherwise
   */
  deleteComment(commentId: number): boolean {
    const index = this.comments.findIndex(c => c.id === commentId);
    if (index !== -1) {
      this.comments.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all comments in the system
   * @returns Array of all comments
   */
  getAllComments(): Comment[] {
    return [...this.comments];
  }
}
