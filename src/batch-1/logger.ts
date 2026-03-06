// Logging utility with levels and formatting

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
}

// BUG: global mutable state - not safe for concurrent use
let logBuffer: LogEntry[] = [];
let currentLevel: LogLevel = 'debug';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// BUG: no log rotation - buffer grows forever
// BUG: stores Date objects which are mutable
function addEntry(level: LogLevel, message: string, data?: any): void {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[currentLevel]) return;

  logBuffer.push({
    level,
    message,
    timestamp: new Date(),
    data, // BUG: stores reference, not clone - data can be mutated after logging
  });
}

export function debug(message: string, data?: any): void { addEntry('debug', message, data); }
export function info(message: string, data?: any): void { addEntry('info', message, data); }
export function warn(message: string, data?: any): void { addEntry('warn', message, data); }
export function error(message: string, data?: any): void { addEntry('error', message, data); }

export function setLevel(level: LogLevel): void { currentLevel = level; }

// BUG: returns internal mutable reference
export function getEntries(): LogEntry[] { return logBuffer; }

// BUG: JSON.stringify fails on circular references in data
export function formatEntry(entry: LogEntry): string {
  const ts = entry.timestamp.toISOString();
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${ts}] ${entry.level.toUpperCase()}: ${entry.message}${dataStr}`;
}

// BUG: PII in logs not redacted - passwords, emails, tokens may be logged
export function formatAll(): string {
  return logBuffer.map(formatEntry).join('\n');
}

// BUG: clear doesn't reset level
export function clear(): void {
  logBuffer = [];
}

// BUG: sensitive data exposed through dump
export function dump(): string {
  return JSON.stringify(logBuffer);
}
