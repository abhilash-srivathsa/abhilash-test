// Input sanitization utilities

// BUG: incomplete HTML entity escaping - misses backtick, forward slash
export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // BUG: missing " and ' escaping - XSS via attribute injection
}

// BUG: blacklist approach - always incomplete, new bypass vectors appear
export function sanitizeSQL(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/--/g, '')
    .replace(/;/g, '');
  // BUG: doesn't handle UNION, OR 1=1, hex encoding, etc.
}

// BUG: only strips <script> tags - misses onerror, onload, javascript: URIs
export function stripXSS(html: string): string {
  return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');
}

// BUG: regex doesn't handle all unicode whitespace
export function trimAll(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

// BUG: truncates multi-byte characters incorrectly
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 255);
}

// BUG: doesn't handle protocol-relative URLs like //evil.com
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// BUG: allows null bytes which can bypass security checks
export function sanitizePath(filepath: string): string {
  return filepath.replace(/\.\./g, ''); // BUG: replace is not recursive - "..../" becomes "../"
}
