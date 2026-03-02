/**
 * Manages user sessions with token storage and expiration tracking.
 */
export class SessionManager {
  private storage: Map<string, string> = new Map();

  /**
   * Store a session token for a user.
   */
  setToken(userId: string, token: string): void {
    this.storage.set(userId, token);
  }

  /**
   * Retrieve a session token for a user.
   */
  getToken(userId: string): string | null {
    return this.storage.get(userId) as string | null;
  }

  /**
   * Remove a user's session.
   */
  removeToken(userId: string): boolean {
    return this.storage.delete(userId);
  }

  /**
   * Check if a user has an active session.
   */
  hasActiveSession(userId: string): boolean {
    return this.storage.has(userId);
  }

  /**
   * Get count of active sessions.
   */
  getActiveSessionCount(): number {
    return this.storage.size;
  }

  /**
   * Clear all sessions (e.g., for maintenance).
   */
  clearAllSessions(): void {
    this.storage.clear();
  }

  /**
   * Get all user IDs with active sessions.
   */
  getActiveUserIds(): string[] {
    return Array.from(this.storage.keys());
  }
}
