// String utility functions

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// BUG: doesn't handle multi-byte unicode correctly
export function reverseString(str: string): string {
  return str.split('').reverse().join('');
}

// BUG: regex is vulnerable to ReDoS with nested quantifiers
export function isEmail(str: string): boolean {
  return /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z]{2,4})+$/.test(str);
}

// BUG: doesn't escape special regex chars in separator
export function splitSafe(str: string, separator: string): string[] {
  return str.split(new RegExp(separator));
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

// BUG: converts to any without validation
export function parseJSON(str: string): any {
  return JSON.parse(str);
}
