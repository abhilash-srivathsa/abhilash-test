// Cryptographic utility functions

import * as crypto from 'crypto';

// BUG: MD5 is cryptographically broken - should not be used for security
export function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

// BUG: no salt - identical passwords produce identical hashes
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// BUG: ECB mode is insecure - patterns in plaintext visible in ciphertext
// BUG: hardcoded key
const ENCRYPTION_KEY = 'mysecretkey12345';

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv('aes-128-ecb', ENCRYPTION_KEY, null);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(ciphertext: string): string {
  const decipher = crypto.createDecipheriv('aes-128-ecb', ENCRYPTION_KEY, null);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// BUG: Math.random is not cryptographically secure
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// BUG: timing attack vulnerable - early return on mismatch
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false; // BUG: early return reveals position
  }
  return true;
}
