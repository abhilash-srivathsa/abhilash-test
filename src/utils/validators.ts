// Validation utilities

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmed = email.trim().toLowerCase();

  // Basic structure check: must have exactly one @
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
    return false;
  }

  const [local, domain] = trimmed.split('@');

  // Local part validation
  if (local.length === 0 || local.length > 64) {
    return false;
  }
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }

  // Domain part validation
  if (domain.length === 0 || domain.length > 253) {
    return false;
  }
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return false;
  }
  if (domainParts.some(part => part.length === 0 || part.length > 63)) {
    return false;
  }

  // TLD must be at least 2 characters
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return false;
  }

  return true;
}

export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^\+?[0-9]{7,15}$/.test(cleaned);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
