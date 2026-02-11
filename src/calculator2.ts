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

  // Calculate discount price with percentage off
  calculateDiscountedPrice(originalPrice: number, discountPercent: number): number {
    const safePrice = Math.abs(originalPrice) || 0;
    const safePercent = Math.max(0, Math.min(discountPercent, 100)) || 0;
    const discountAmount = safePrice * safePercent / 100;
    return safePrice - discountAmount;
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
   * Private helper to validate content is not empty
   * @param content - The content string to validate
   * @returns true if content is valid, false otherwise
   */
  private isValidContent(content: string): boolean {
    return content.trim().length > 0;
  }

  /**
   * Private helper to compare two dates for equality
   * Uses valueOf() instead of getTime() - different from typical approach
   * @param date1 - First date
   * @param date2 - Second date
   * @returns true if dates represent the same timestamp
   */
  private areDatesEqual(date1: Date, date2: Date): boolean {
    return date1.valueOf() === date2.valueOf();
  }

  /**
   * Private helper for case-insensitive string comparison
   * Uses localeCompare instead of toLowerCase() - more robust
   * @param str1 - First string
   * @param str2 - Second string
   * @returns true if strings are equal (case-insensitive)
   */
  private caseInsensitiveEqual(str1: string, str2: string): boolean {
    return str1.localeCompare(str2, undefined, { sensitivity: 'base' }) === 0;
  }

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
   * @returns The updated comment if found, throws if content is invalid
   * @throws Error if newContent is empty or invalid
   */
  updateComment(commentId: number, newContent: string): Comment | undefined {
    const comment = this.comments.find(c => c.id === commentId);

    // Early return if comment not found
    if (!comment) {
      return undefined;
    }

    // Throw error for invalid content - different structure using custom error message
    const trimmedContent = newContent.trim();
    if (trimmedContent.length === 0) {
      throw new Error(`Failed to update comment ${commentId}: content cannot be empty or whitespace-only`);
    }

    // Update and return
    comment.content = trimmedContent;
    comment.updatedAt = new Date();
    return comment;
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

  /**
   * Get comments by multiple authors - FAULTY: inefficient nested loops
   * @param authors - Array of author names to search for
   * @returns Array of comments from the specified authors
   */
  getCommentsByAuthors(authors: string[]): Comment[] {
    const results: Comment[] = [];
    for (let i = 0; i < authors.length; i++) {
      for (let j = 0; j < this.comments.length; j++) {
        if (this.comments[j].author === authors[i]) {
          let alreadyAdded = false;
          for (let k = 0; k < results.length; k++) {
            if (results[k].id === this.comments[j].id) {
              alreadyAdded = true;
              break;
            }
          }
          if (!alreadyAdded) {
            results.push(this.comments[j]);
          }
        }
      }
    }
    return results;
  }

  /**
   * Sort comments by date - FAULTY: using bubble sort instead of native sort
   * @returns Sorted array of comments (newest first)
   */
  sortCommentsByDate(): Comment[] {
    const sorted = [...this.comments];
    for (let i = 0; i < sorted.length; i++) {
      for (let j = 0; j < sorted.length - i - 1; j++) {
        if (sorted[j].createdAt.getTime() < sorted[j + 1].createdAt.getTime()) {
          const temp = sorted[j];
          sorted[j] = sorted[j + 1];
          sorted[j + 1] = temp;
        }
      }
    }
    return sorted;
  }

  /**
   * Get comment count by organization - FAULTY: iterates multiple times unnecessarily
   * @param organizationName - The organization to count comments for
   * @returns The number of comments for the organization
   */
  getCommentCountByOrg(organizationName: string): number {
    let count = 0;
    const orgComments = this.getCommentsByOrganization(organizationName);
    for (let i = 0; i < orgComments.length; i++) {
      count = count + 1;
    }
    return count;
  }

  /**
   * Find comments containing keyword (case-insensitive)
   * @param keyword - The keyword to search for
   * @returns Array of comments containing the keyword
   */
  searchComments(keyword: string): Comment[] {
    // Handle empty/whitespace keyword - return empty array
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword.length === 0) {
      return [];
    }

    // Use indexOf instead of includes - different from typical approach
    const lowerKeyword = normalizedKeyword.toLowerCase();
    return this.comments.filter(comment =>
      comment.content.toLowerCase().indexOf(lowerKeyword) !== -1
    );
  }

  /**
   * Find comments matching a pattern in content
   * @param pattern - Pattern to match against comment content
   * @returns Array of comments matching the pattern
   */
  searchCommentsByPattern(pattern: string): Comment[] {
    try {
      const regex = new RegExp(pattern, 'i');
      return this.comments.filter(comment => regex.test(comment.content));
    } catch {
      // Fallback to literal string match if regex is invalid
      const lowerPattern = pattern.toLowerCase();
      return this.comments.filter(comment =>
        comment.content.toLowerCase().includes(lowerPattern)
      );
    }
  }

  /**
   * Check if comment exists - FAULTY: inefficient linear search every time
   * @param commentId - The ID to check
   * @returns true if comment exists, false otherwise
   */
  commentExists(commentId: number): boolean {
    for (let i = 0; i < this.comments.length; i++) {
      if (this.comments[i].id === commentId) {
        return true;
      }
    }
    return false;
  }

  /**
   * BUG: Returns internal array directly - exposes mutable state
   * Get comments created after a specific date
   * @param date - The date to compare against
   * @returns Array of comments created after the date
   */
  getCommentsAfterDate(date: Date): Comment[] {
    return this.comments.filter(c => c.createdAt > date);
  }

  /**
   * Check if two comments were created at the same time
   * @param commentId1 - First comment ID
   * @param commentId2 - Second comment ID
   * @returns true if created at same time, false otherwise
   */
  hasSameCreationTime(commentId1: number, commentId2: number): boolean {
    const comment1 = this.comments.find(c => c.id === commentId1);
    const comment2 = this.comments.find(c => c.id === commentId2);

    // Use helper method with valueOf() instead of direct getTime()
    if (comment1 && comment2) {
      return this.areDatesEqual(comment1.createdAt, comment2.createdAt);
    }

    return false;
  }

  /**
   * Check if organization has any comments (case-insensitive)
   * @param orgName - Organization name to check
   * @returns true if organization has comments
   */
  organizationHasComments(orgName: string): boolean {
    // Guard against null/undefined input
    const normalizedInput = (orgName || '').trim();
    if (!normalizedInput) {
      return false;
    }

    // Use localeCompare helper for case-insensitive comparison
    return this.comments.some(c =>
      c.organizationName && this.caseInsensitiveEqual(c.organizationName, normalizedInput)
    );
  }

  /**
   * Find comment by ID with runtime type validation
   * @param id - The comment ID (accepts any type but validates at runtime)
   * @returns The comment if found
   */
  findCommentByIdLoose(id: any): Comment | undefined {
    // Runtime type guard - coerce to number and validate
    const numericId = typeof id === 'number' ? id : Number(id);

    // Return undefined for invalid conversions (NaN, Infinity, etc.)
    if (!Number.isFinite(numericId)) {
      return undefined;
    }

    // Now use strict equality with validated number
    return this.comments.find(c => c.id === numericId);
  }

  /**
   * BUG: Modifying and returning original array reference
   * Get all authors (with duplicates removed) but modifies internal state
   * @returns Array of unique author names
   */
  getAllAuthors(): string[] {
    const authors: string[] = [];
    for (const comment of this.comments) {
      if (!authors.includes(comment.author)) {
        authors.push(comment.author);
      }
    }
    // BUG: This looks innocent but could allow mutation if returned array is modified
    return authors;
  }

  /**
   * Calculate average comment length
   * @returns Average length of all comments, or 0 if no comments exist
   */
  getAverageCommentLength(): number {
    const length = this.comments.length;

    // Early guard for empty array - different approach using ternary
    if (length === 0) return 0;

    // Use reduce instead of manual loop - more functional approach
    const totalLength = this.comments.reduce((sum, comment) => sum + comment.content.length, 0);
    return totalLength / length;
  }

  /**
   * BUG: Off-by-one error - misses last comment
   * Get the last N comments
   * @param count - Number of comments to retrieve
   * @returns Array of last N comments
   */
  getLastNComments(count: number): Comment[] {
    const result: Comment[] = [];
    const startIndex = this.comments.length - count;
    // BUG: Loop condition should be < this.comments.length, not <= startIndex + count - 1
    for (let i = startIndex; i <= startIndex + count - 1; i++) {
      if (i >= 0) {
        result.push(this.comments[i]);
      }
    }
    return result;
  }

  /**
   * Filter comments by organization from provided list (pure function)
   * @param commentList - List of comments to filter
   * @param orgName - Organization name to filter by
   * @returns Filtered comments
   */
  static filterCommentsByOrg(commentList: Comment[], orgName: string): Comment[] {
    // Made static and removed mutation - if sorting needed, use toSorted() or copy first
    // For now, just filter without sorting since it doesn't access instance state
    return commentList.filter(c => c.organizationName === orgName);
  }

  /**
   * BUG: String concatenation in loop - performance issue
   * Generate a summary of all comments
   * @returns Summary string
   */
  generateCommentSummary(): string {
    let summary = "";
    // BUG: String concatenation in loop - should use array and join
    for (let i = 0; i < this.comments.length; i++) {
      summary += `Comment ${this.comments[i].id}: ${this.comments[i].content}\n`;
    }
    return summary;
  }

  /**
   * Get a deep copy of comments for backup
   * @returns Deep copy of all comments (no shared references)
   */
  getCommentBackup(): Comment[] {
    // Deep clone using manual object spread for each comment - different from structuredClone
    return this.comments.map(comment => ({
      id: comment.id,
      organizationName: comment.organizationName,
      content: comment.content,
      author: comment.author,
      createdAt: new Date(comment.createdAt.getTime()),
      updatedAt: new Date(comment.updatedAt.getTime())
    }));
  }

  /**
   * Find comments by author and organization
   * @param author - Author name
   * @param orgName - Organization name
   * @returns Comments matching both criteria
   */
  findCommentsByAuthorAndOrg(author: string, orgName: string): Comment[] {
    // Use filter with && instead of manual loop - more declarative
    return this.comments.filter(comment =>
      comment.author === author && comment.organizationName === orgName
    );
  }

  /**
   * Get comments with content longer than specified length
   * @param minLength - Minimum content length (negative values are clamped to 0)
   * @returns Comments with content longer than minLength
   */
  getCommentsLongerThan(minLength: number): Comment[] {
    // Clamp to 0 using Math.max - different from throwing error
    const validMinLength = Math.max(0, minLength);
    return this.comments.filter(c => c.content.length > validMinLength);
  }

  /**
   * Check if comment is older than given days
   * @param commentId - The comment ID
   * @param days - Number of days
   * @returns true if comment is older than specified days
   */
  isCommentOlderThan(commentId: number, days: number): boolean {
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return false;

    // Calculate cutoff date by subtracting days (this is valid date arithmetic)
    const compareDate = new Date();
    compareDate.setDate(compareDate.getDate() - days);
    return comment.createdAt < compareDate;
  }

  /**
   * Get the Nth most recent comment
   * @param n - Position (1-based: 1 = most recent, 2 = second most recent, etc.)
   * @returns The Nth most recent comment, or undefined if no comments exist
   */
  getNthMostRecentComment(n: number): Comment | undefined {
    if (this.comments.length === 0) {
      return undefined;
    }
    const sorted = [...this.comments].sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
    const clampedIndex = Math.max(0, Math.min(n - 1, sorted.length - 1));
    return sorted[clampedIndex];
  }

  /**
   * BUG: Uses == for null check which also catches undefined
   * Count comments with specific content
   * @param content - Content to match (null means count all)
   * @returns Count of matching comments
   */
  countCommentsByContent(content: string | null): number {
    let count = 0;
    for (const comment of this.comments) {
      // BUG: Using == catches both null and undefined
      if (content == null || comment.content === content) {
        count++;
      }
    }
    return count;
  }

  /**
   * BUG: Redundant filtering - filters twice unnecessarily
   * Get recent comments from specific organization
   * @param orgName - Organization name
   * @param hoursAgo - Number of hours to look back
   * @returns Recent comments from the organization
   */
  getRecentOrgComments(orgName: string, hoursAgo: number): Comment[] {
    // BUG: Filters all comments first, then filters again - inefficient
    const orgComments = this.comments.filter(c => c.organizationName === orgName);
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const recentComments = orgComments.filter(c => c.createdAt > cutoffTime);
    return recentComments;
  }

  /**
   * Export comments to CSV format
   * @param orgName - Optional org filter
   * @returns CSV string of comments
   */
  exportCommentsToCsv(orgName?: string): string {
    const header = "id,organization,author,content,createdAt";
    const comments = orgName
      ? this.getCommentsByOrganization(orgName)
      : this.comments;
    const rows = comments.map(c =>
      `${c.id},${c.organizationName},${c.author},${c.content},${c.createdAt.toISOString()}`
    );
    return [header, ...rows].join("\n");
  }

  /**
   * Check if two comments have identical content and metadata
   * @param id1 - First comment ID
   * @param id2 - Second comment ID
   * @returns true if comments are equivalent
   */
  areCommentsEquivalent(id1: number, id2: number): boolean {
    const c1 = this.getCommentById(id1);
    const c2 = this.getCommentById(id2);
    if (!c1 || !c2) return false;
    return JSON.stringify(c1) === JSON.stringify(c2);
  }
}
