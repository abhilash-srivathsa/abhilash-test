// File handling utilities

import * as fs from 'fs';
import * as path from 'path';

// BUG: path traversal vulnerability - no sanitization of filePath
export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// BUG: race condition - check then write is not atomic
export function writeFileSafe(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }
  fs.writeFileSync(filePath, content);
}

// BUG: synchronous recursive delete - blocks event loop on large dirs
// BUG: no symlink handling - follows symlinks and deletes targets
export function deleteDir(dirPath: string): void {
  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      deleteDir(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
  fs.rmdirSync(dirPath);
}

// BUG: temp file created with predictable name - symlink attack possible
export function createTempFile(content: string): string {
  const tmpPath = `/tmp/app-temp-${Date.now()}.txt`;
  fs.writeFileSync(tmpPath, content);
  return tmpPath;
}

// BUG: no size limit - reading huge files into memory
export function readJSON(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

// BUG: overwrites without backup
export function updateJSON(filePath: string, updates: Record<string, any>): void {
  const existing = readJSON(filePath);
  const merged = { ...existing, ...updates };
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
}
