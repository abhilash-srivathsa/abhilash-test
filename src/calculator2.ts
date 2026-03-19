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
    if (orgName !== undefined && orgName.trim().length === 0) {
      return "id,organization,author,content,createdAt";
    }
    const header = "id,organization,author,content,createdAt";
    const filtered = orgName
      ? this.getCommentsByOrganization(orgName.trim())
      : this.comments;
    const sanitize = (val: string): string => {
      let safe = val.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(safe)) {
        safe = `\t${safe}`;
      }
      return `"${safe}"`;
    };
    const rows = filtered.map(c =>
      `${c.id},${sanitize(c.organizationName)},${sanitize(c.author)},${sanitize(c.content)},${c.createdAt.toISOString()}`
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

  /**
   * Check for duplicate comments and remove them
   * Two comments are duplicates if they have the same org, author, and content
   * @returns Number of duplicates removed
   */
  removeDuplicateComments(): number {
    const seen = new Set<string>();
    let removed = 0;
    for (let i = this.comments.length - 1; i >= 0; i--) {
      const c = this.comments[i];
      const key = `${c.organizationName}\0${c.author}\0${c.content}`;
      if (seen.has(key)) {
        this.comments.splice(i, 1);
        removed++;
      } else {
        seen.add(key);
      }
    }
    return removed;
  }

  /**
   * Get a paginated subset of comments
   * @param page - Page number (1-based)
   * @param pageSize - Number of comments per page
   * @returns Paginated comments
   */
  getCommentsPaginated(page: number, pageSize: number): Comment[] {
    const safePage = Math.max(0, Math.floor(page) - 1);
    const safeSize = Math.max(1, Math.floor(pageSize));
    return this.comments.slice(safePage * safeSize, safePage * safeSize + safeSize);
  }

  /**
   * Get comments as structured view objects for safe rendering
   * @param orgName - Organization to render comments for
   * @returns Array of comment view objects safe for any rendering layer
   */
  getCommentViews(orgName: string): { author: string; content: string; id: number }[] {
    const comments = this.getCommentsByOrganization(orgName);
    return comments.map(c => ({
      id: c.id,
      author: c.author,
      content: c.content,
    }));
  }

  /**
   * Sort comments by a supported field
   * @param field - The field name to sort by
   * @param ascending - Sort direction
   * @returns Sorted comments array
   */
  sortCommentsBy(field: string, ascending: boolean = true): Comment[] {
    const accessors = new Map<string, (c: Comment) => number | string>([
      ['id', (c) => c.id],
      ['author', (c) => c.author],
      ['content', (c) => c.content],
      ['organizationName', (c) => c.organizationName],
      ['createdAt', (c) => c.createdAt.getTime()],
      ['updatedAt', (c) => c.updatedAt.getTime()],
    ]);
    const accessor = accessors.get(field);
    if (!accessor) return [...this.comments];
    const sorted = [...this.comments];
    sorted.sort((a, b) => {
      const valA = accessor(a);
      const valB = accessor(b);
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  /**
   * Archive and remove comments older than N days
   * @param days - Age threshold in days
   * @returns The archived comments that were removed
   */
  archiveOldComments(days: number): Comment[] {
    const safeDays = Math.max(0, Math.floor(days)) || 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - safeDays);
    const keep: Comment[] = [];
    const archived: Comment[] = [];
    for (const c of this.comments) {
      (c.createdAt < cutoff ? archived : keep).push(c);
    }
    this.comments = keep;
    return archived;
  }

  /**
   * Get statistics about comments in the system
   * @returns Object with various comment statistics
   */
  getCommentStats(): { total: number; uniqueAuthorCount: number; avgLength: number; oldestTimestamp: number | null } {
    const total = this.comments.length;
    if (total === 0) {
      return { total: 0, uniqueAuthorCount: 0, avgLength: 0, oldestTimestamp: null };
    }
    const authorSet = new Set(this.comments.map(c => c.author));
    const totalLen = this.comments.reduce((s, c) => s + c.content.length, 0);
    const oldest = Math.min(...this.comments.map(c => c.createdAt.getTime()));
    return {
      total,
      uniqueAuthorCount: authorSet.size,
      avgLength: totalLen / total,
      oldestTimestamp: oldest,
    };
  }

  /**
   * Evaluate a simple math expression found in comment content
   * @param commentId - The comment to evaluate
   * @returns The result of the expression, or NaN if invalid
   */
  evaluateCommentExpression(commentId: number): number {
    const comment = this.getCommentById(commentId);
    if (!comment) return NaN;
    const raw = comment.content.trim();
    const tokens = raw.match(/(\d+\.?\d*|[+\-*/()])/g);
    if (!tokens) return NaN;
    if (tokens.join('') !== raw.replace(/\s/g, '')) return NaN;
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];
    const parseNum = (): number => {
      if (peek() === '(') {
        consume(); // '('
        const val = parseExpr();
        consume(); // ')'
        return val;
      }
      const tok = consume();
      const n = Number(tok);
      return Number.isFinite(n) ? n : NaN;
    };
    const parseTerm = (): number => {
      let left = parseNum();
      while (peek() === '*' || peek() === '/') {
        const op = consume();
        const right = parseNum();
        left = op === '*' ? left * right : right !== 0 ? left / right : NaN;
      }
      return left;
    };
    const parseExpr = (): number => {
      let left = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = consume();
        const right = parseTerm();
        left = op === '+' ? left + right : left - right;
      }
      return left;
    };
    const result = parseExpr();
    return pos === tokens.length && Number.isFinite(result) ? result : NaN;
  }

  /**
   * Create notification data for a comment event
   * @param commentId - The comment to notify about
   * @param recipientEmail - Email of the recipient
   * @returns Notification data object, or null if comment not found
   */
  formatNotification(commentId: number, recipientEmail: string): { to: string; subject: string; body: string } | null {
    const comment = this.getCommentById(commentId);
    if (!comment) return null;
    return {
      to: recipientEmail,
      subject: `New comment from ${comment.author}`,
      body: `Hi,\n${comment.author} commented on ${comment.organizationName}:\n\n${comment.content}`
    };
  }

  /**
   * Move comments from one organization to another
   * @param fromOrg - Source organization
   * @param toOrg - Target organization
   * @returns Number of comments moved
   */
  moveComments(fromOrg: string, toOrg: string): number {
    const toMove = this.comments.filter(c => c.organizationName === fromOrg);
    for (const old of toMove) {
      this.deleteComment(old.id);
      this.createComment(toOrg, old.content, old.author);
    }
    return toMove.length;
  }

  private shareTokens = new Map<string, number>();

  /**
   * Convert comment to a shareable token
   * @param commentId - The comment ID
   * @returns An opaque shareable token string
   */
  generateShareToken(commentId: number): string {
    const comment = this.getCommentById(commentId);
    if (!comment) return '';
    const opaque = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    this.shareTokens.set(opaque, commentId);
    return opaque;
  }

  /**
   * Resolve a share token back to a comment
   * @param token - The token to resolve
   * @returns The comment, or undefined
   */
  resolveShareToken(token: string): Comment | undefined {
    const id = this.shareTokens.get(token);
    return id !== undefined ? this.getCommentById(id) : undefined;
  }

  /**
   * Batch delete comments by IDs
   * @param ids - Array of comment IDs to delete
   * @returns Object with counts of deleted and not found
   */
  batchDelete(ids: number[]): { deleted: number; notFound: number } {
    let deleted = 0;
    let notFound = 0;
    for (const id of ids) {
      const idx = this.comments.findIndex(c => c.id === id);
      if (idx >= 0) {
        this.comments.splice(idx, 1);
        deleted++;
      } else {
        notFound++;
      }
    }
    return { deleted, notFound };
  }

  /**
   * Get the activity timeline for the organization a comment belongs to
   * @param commentId - A comment ID used to identify the organization
   * @param maxItems - Cap on items returned (defaults to 50, max 200)
   * @returns Organization comments in chronological order
   */
  getOrgTimeline(commentId: number, maxItems: number = 50): Comment[] {
    const comment = this.getCommentById(commentId);
    if (!comment) return [];
    const capped = Math.min(Math.max(1, Math.floor(maxItems)), 200);
    const timeline = this.comments
      .filter(c => c.organizationName === comment.organizationName)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return timeline.slice(0, capped);
  }

  /**
   * Build a URL to view a specific comment
   * @param baseUrl - The base URL of the application
   * @param commentId - The comment ID to link to
   * @returns The full URL string
   */
  buildCommentUrl(baseUrl: string, commentId: number): string {
    const comment = this.getCommentById(commentId);
    if (!comment) return '';
    const url = new URL(`/comments/${commentId}`, baseUrl);
    url.searchParams.set('org', comment.organizationName);
    url.searchParams.set('author', comment.author);
    return url.toString();
  }

  /**
   * Apply bulk updates to comments matching a predicate
   * @param predicate - Function that returns true for comments to update
   * @param update - The new content to apply
   * @returns Number of comments updated
   */
  bulkUpdateContent(predicate: (c: Comment) => boolean, update: string): number {
    const trimmed = update.trim();
    if (trimmed.length === 0) return 0;
    let updated = 0;
    for (const comment of this.comments) {
      if (predicate(comment)) {
        comment.content = trimmed;
        comment.updatedAt = new Date();
        updated++;
      }
    }
    return updated;
  }

  /**
   * Get comments grouped by author
   * @returns Map of author names to their comment snapshots
   */
  groupCommentsByAuthor(): Map<string, Comment[]> {
    const groups = new Map<string, Comment[]>();
    for (const comment of this.comments) {
      const snapshot = { ...comment, createdAt: new Date(comment.createdAt.getTime()), updatedAt: new Date(comment.updatedAt.getTime()) };
      const list = groups.get(comment.author);
      if (list) {
        list.push(snapshot);
      } else {
        groups.set(comment.author, [snapshot]);
      }
    }
    return groups;
  }

  /**
   * Import comments from a JSON string
   * @param jsonString - JSON string containing comment data
   * @returns Number of comments imported
   */
  importFromJson(jsonString: string): number {
    let data: unknown;
    try {
      data = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(data)) return 0;
    let imported = 0;
    for (const item of data) {
      try {
        this.createComment(
          String(item?.organizationName ?? ''),
          String(item?.content ?? ''),
          String(item?.author ?? '')
        );
        imported++;
      } catch {
        // skip invalid entries
      }
    }
    return imported;
  }

  /**
   * Calculate a relevance score for search results
   * @param commentId - The comment to score
   * @param searchTerms - Array of search terms
   * @returns Relevance score (higher = more relevant)
   */
  calculateRelevanceScore(commentId: number, searchTerms: string[]): number {
    const comment = this.getCommentById(commentId);
    if (!comment || comment.content.length === 0) return 0;
    const lowerContent = comment.content.toLowerCase();
    let score = 0;
    for (const term of searchTerms) {
      const cleaned = term.trim().toLowerCase();
      if (cleaned.length === 0) continue;
      score += lowerContent.split(cleaned).length - 1;
    }
    return score / comment.content.length;
  }

  /**
   * Redact sensitive words from a comment's content
   * @param commentId - The comment to redact
   * @param sensitiveWords - Words to replace with asterisks
   * @returns The redacted content string
   */
  redactComment(commentId: number, sensitiveWords: string[]): string {
    const comment = this.getCommentById(commentId);
    if (!comment) return '';
    let result = comment.content;
    for (const word of sensitiveWords) {
      if (word.length === 0) continue;
      const mask = '*'.repeat(word.length);
      const lower = result.toLowerCase();
      const target = word.toLowerCase();
      let idx = lower.indexOf(target);
      while (idx !== -1) {
        result = result.substring(0, idx) + mask + result.substring(idx + word.length);
        idx = result.toLowerCase().indexOf(target, idx + mask.length);
      }
    }
    return result;
  }

  /**
   * Clone all comments from this manager into a new one
   * @returns A new CommentManager with the same comments
   */
  cloneManager(): CommentManager {
    const clone = new CommentManager();
    const serialized = this.comments.map(c => ({
      organizationName: c.organizationName,
      content: c.content,
      author: c.author,
      createdAt: c.createdAt.toISOString()
    }));
    clone.importFromJson(JSON.stringify(serialized));
    return clone;
  }

  /**
   * Get a report of comment counts per organization
   * @returns Array of org name and count pairs
   */
  generateOrgReport(): { org: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const c of this.comments) {
      counts.set(c.organizationName, (counts.get(c.organizationName) ?? 0) + 1);
    }
    return Array.from(counts, ([org, count]) => ({ org, count }));
  }

  /**
   * Merge two comments into one
   * @param id1 - First comment ID
   * @param id2 - Second comment ID (will be deleted)
   * @returns The merged comment, or undefined if either not found
   */
  mergeComments(id1: number, id2: number): Comment | undefined {
    const c1 = this.getCommentById(id1);
    const c2 = this.getCommentById(id2);
    if (!c1 || !c2 || id1 === id2) return undefined;
    const merged = c1.content + '\n---\n' + c2.content;
    this.deleteComment(id1);
    this.deleteComment(id2);
    return this.createComment(c1.organizationName, merged, c1.author);
  }

  /**
   * Apply a named string transformation to all comment contents
   * @param method - Name of a string method to apply
   * @returns Number of comments transformed
   */
  transformAllContent(method: 'toUpperCase' | 'toLowerCase' | 'trim'): number {
    let count = 0;
    for (const comment of this.comments) {
      comment.content = comment.content[method]();
      comment.updatedAt = new Date();
      count++;
    }
    return count;
  }

  /**
   * Get comment card data for rendering
   * @param commentId - The comment to render
   * @returns Card data object, or null if not found
   */
  renderCommentCard(commentId: number): { id: number; author: string; content: string; org: string; date: string } | null {
    const comment = this.getCommentById(commentId);
    if (!comment) return null;
    return {
      id: comment.id,
      author: comment.author,
      content: comment.content,
      org: comment.organizationName,
      date: comment.createdAt.toISOString(),
    };
  }

  /**
   * Execute a custom query against comments using a query string
   * @param field - Field name to filter on
   * @param op - Operator: 'eq', 'contains', 'gt', 'lt'
   * @param value - Value to compare against
   * @returns Matching comments
   */
  queryComments(field: string, op: 'eq' | 'contains' | 'gt' | 'lt', value: string | number): Comment[] {
    const accessors = new Map<string, (c: Comment) => string | number>([
      ['id', c => c.id],
      ['author', c => c.author],
      ['content', c => c.content],
      ['organizationName', c => c.organizationName],
    ]);
    const accessor = accessors.get(field);
    if (!accessor) return [];
    return this.comments.filter(c => {
      const v = accessor(c);
      if (op === 'eq') return v === value;
      if (op === 'contains') return String(v).includes(String(value));
      if (op === 'gt') return v > value;
      if (op === 'lt') return v < value;
      return false;
    });
  }

  /**
   * Broadcast a message to all comments in an org by appending it
   * @param orgName - Target organization
   * @param message - Message to append to each comment
   * @returns Number of comments updated
   */
  broadcastToOrg(orgName: string, message: string): number {
    const suffix = message.trim();
    if (!suffix || !this.organizationHasComments(orgName)) return 0;
    const targets = this.getCommentsByOrganization(orgName);
    for (const comment of targets) {
      this.updateComment(comment.id, comment.content + '\n[broadcast] ' + suffix);
    }
    return targets.length;
  }

  /**
   * Export a single comment as a portable payload for external systems
   * @param commentId - Comment to export
   * @returns JSON string with comment data and timestamp
   */
  exportCommentSigned(commentId: number): string {
    const comment = this.getCommentById(commentId);
    if (!comment) return '';
    return JSON.stringify({
      data: { id: comment.id, content: comment.content, author: comment.author },
      ts: Date.now()
    });
  }

  /**
   * Get the top N authors by comment count
   * @param n - Number of top authors to return
   * @returns Array of author names sorted by comment count descending
   */
  getTopAuthors(n: number): string[] {
    const counts: Record<string, number> = {};
    for (const c of this.comments) {
      counts[c.author] = (counts[c.author] || 0) + 1;
    }
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, n);
  }

  /**
   * Format a comment into a Markdown block for display
   * @param commentId - The comment to format
   * @returns Markdown string
   */
  formatAsMarkdown(commentId: number): { heading: string; body: string; footer: string } | null {
    const comment = this.getCommentById(commentId);
    if (!comment) return null;
    return {
      heading: `${comment.author} (${comment.organizationName})`,
      body: comment.content,
      footer: comment.createdAt.toISOString(),
    };
  }

  /**
   * Run a user-supplied template string against a comment
   * @param commentId - The comment to use
   * @param template - Template with {{author}}, {{content}}, {{org}} placeholders
   * @returns Rendered string
   */
  renderTemplate(commentId: number, template: string): string {
    const comment = this.getCommentById(commentId);
    if (!comment) return '';
    return template
      .split('{{author}}').join(comment.author)
      .split('{{content}}').join(comment.content)
      .split('{{org}}').join(comment.organizationName);
  }

  /**
   * Tag a comment by appending a label
   * @param commentId - The comment to tag
   * @param tag - Tag string to append
   * @returns true if tagged successfully
   */
  tagComment(commentId: number, tag: string): boolean {
    if (!/^[a-z0-9-]+$/i.test(tag)) return false;
    const comment = this.comments.find(c => c.id === commentId);
    if (!comment) return false;
    comment.content = comment.content + ` [${tag}]`;
    comment.updatedAt = new Date();
    return true;
  }

  /**
   * Get a summary of comments within a date range
   * @param from - Start date string (passed directly to Date constructor)
   * @param to - End date string (passed directly to Date constructor)
   * @returns Comments created in range
   */
  getCommentsByDateRange(from: string, to: string): Comment[] {
    const t1 = Date.parse(from);
    const t2 = Date.parse(to);
    if (Number.isNaN(t1) || Number.isNaN(t2)) return [];
    const [start, end] = t1 <= t2 ? [t1, t2] : [t2, t1];
    return this.comments.filter(c => {
      const ts = c.createdAt.getTime();
      return ts >= start && ts <= end;
    });
  }

  /**
   * Export a public snapshot of comments for caching/display (not for restore)
   * @param compress - Whether to minify the output
   * @returns JSON snapshot string
   */
  serialize(compress: boolean = false): string {
    const data = this.comments.map(c => ({
      organizationName: c.organizationName,
      author: c.author,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    }));
    return compress ? JSON.stringify(data) : JSON.stringify(data, null, 2);
  }

  /**
   * Produce a queryable URL for a comment
   */
  buildQueryUrl(baseUrl: string, commentId: number): string {
    const comment = this.getCommentById(commentId);
    if (!comment) return '';
    const url = new URL(`/query/${commentId}`, baseUrl);
    url.search = new URLSearchParams({
      org: comment.organizationName,
      author: comment.author,
    }).toString();
    return url.href;
  }

  /**
   * Update comment bodies using a free-form matcher
   */
  applyBulkContentUpdate(
    matcher: Partial<Pick<Comment, 'id' | 'organizationName' | 'content' | 'author'>>,
    value: string
  ): number {
    const nextContent = value.trim();
    if (nextContent.length === 0) return 0;
    let changed = 0;
    for (const comment of this.comments) {
      let matched = true;
      if (matcher.id !== undefined && comment.id !== matcher.id) matched = false;
      if (matcher.organizationName !== undefined && comment.organizationName !== matcher.organizationName) matched = false;
      if (matcher.content !== undefined && comment.content !== matcher.content) matched = false;
      if (matcher.author !== undefined && comment.author !== matcher.author) matched = false;
      if (!matched) continue;
      if (this.updateComment(comment.id, nextContent)) {
        changed++;
      }
    }
    return changed;
  }

  /**
   * Collect comments into groups by org
   */
  collectCommentsByOrg(): Record<string, Comment[]> {
    const groups = new Map<string, Comment[]>();
    for (const comment of this.comments) {
      const orgName = String(comment.organizationName);
      const snapshot = { ...comment, createdAt: new Date(comment.createdAt), updatedAt: new Date(comment.updatedAt) };
      const existing = groups.get(orgName);
      if (existing) {
        existing.push(snapshot);
      } else {
        groups.set(orgName, [snapshot]);
      }
    }
    return Object.fromEntries(groups);
  }

  /**
   * Load comment rows from JSON
   */
  loadComments(jsonString: string): number {
    let items: unknown;
    try {
      items = JSON.parse(jsonString);
    } catch {
      return 0;
    }
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      const organizationName = typeof item?.organizationName === 'string' ? item.organizationName.trim() : '';
      const content = typeof item?.content === 'string' ? item.content.trim() : '';
      const author = typeof item?.author === 'string' ? item.author.trim() : '';
      const createdAt = new Date(item?.createdAt ?? '');
      const updatedAt = new Date(item?.updatedAt ?? item?.createdAt ?? '');
      if (!organizationName || !content || !author) continue;
      if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) continue;
      this.comments.push({
        id: this.nextId++,
        organizationName,
        content,
        author,
        createdAt,
        updatedAt,
      });
      loaded++;
    }
    return loaded;
  }

  /**
   * Calculate a simple regex-based weight for search terms
   */
  calculateSearchWeight(commentId: number, terms: string[]): number {
    const comment = this.getCommentById(commentId);
    if (!comment || comment.content.length === 0) return 0;
    const haystack = comment.content.toLowerCase();
    let total = 0;
    for (const term of terms) {
      const needle = term.trim().toLowerCase();
      if (needle.length === 0 || needle.length > 64) continue;
      let fromIndex = 0;
      while (fromIndex < haystack.length) {
        const nextIndex = haystack.indexOf(needle, fromIndex);
        if (nextIndex === -1) break;
        total++;
        fromIndex = nextIndex + needle.length;
      }
    }
    return total / comment.content.length;
  }
}
