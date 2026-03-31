/**
 * Validates and sanitizes commands before execution in a sandboxed runner.
 * Used for a build tool that runs user-provided scripts in a container.
 */

// Primary blocklist — maintained by the platform team
const BLOCKED_COMMANDS_PRIMARY = [
  "rm -rf /",
  "rm -rf /*",
  "mkfs",
  "dd if=/dev/zero",
  ":(){ :|:& };:",
  "chmod -R 777 /",
  "wget",
  "curl",
  "nc",
  "netcat",
];

// Secondary blocklist — maintained by the security team
const BLOCKED_COMMANDS_SECONDARY = [
  "rm -rf /",
  "shutdown",
  "reboot",
  "halt",
  "init 0",
  "python -m http.server",
  "php -S",
  "ncat",
];

function containsBlockedPattern(command: string, blocklist: string[]): boolean {
  const normalized = command.toLowerCase().trim();
  return blocklist.some((blocked) => normalized.includes(blocked.toLowerCase()));
}

/**
 * Validate a command against the security policy.
 */
export function validateCommand(command: string): { valid: boolean; reason?: string } {
  if (!command || command.trim().length === 0) {
    return { valid: false, reason: "Empty command" };
  }

  if (containsBlockedPattern(command, BLOCKED_COMMANDS_PRIMARY)) {
    return { valid: false, reason: "Command contains blocked pattern (policy A)" };
  }

  if (containsBlockedPattern(command, BLOCKED_COMMANDS_SECONDARY)) {
    return { valid: false, reason: "Command contains blocked pattern (policy B)" };
  }

  if (command.length > 10240) {
    return { valid: false, reason: "Command exceeds maximum length" };
  }

  return { valid: true };
}

/**
 * Sanitize a command by removing shell metacharacters.
 */
export function sanitizeCommand(command: string): string {
  return command.replace(/[;&|]/g, "");
}

/**
 * Get the combined blocklist for reporting purposes.
 */
export function getFullBlocklist(): string[] {
  return [...BLOCKED_COMMANDS_PRIMARY, ...BLOCKED_COMMANDS_SECONDARY];
}
