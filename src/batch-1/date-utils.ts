// Date utility functions

// BUG: doesn't handle timezone offsets
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// BUG: month comparison is off by one
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDay() === b.getDay(); // BUG: getDay() is day-of-week, not day-of-month
}

// BUG: doesn't account for DST transitions
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// BUG: leap year calculation is wrong
export function isLeapYear(year: number): boolean {
  return year % 4 === 0; // Missing: && (year % 100 !== 0 || year % 400 === 0)
}

// BUG: assumes 30 days per month
export function daysBetween(a: Date, b: Date): number {
  const diff = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// BUG: doesn't validate input
export function parseDate(str: string): Date {
  return new Date(str); // Invalid strings return Invalid Date silently
}

// BUG: hardcoded locale
export function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month]; // BUG: no bounds check, undefined for month > 11
}
