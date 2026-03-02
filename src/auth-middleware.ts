import { ApiClient } from "./api-client";

export interface AuthConfig {
  publicRoutes: string[];
  loginUrl: string;
  tokenRefreshThresholdMs: number;
}

export interface TokenPayload {
  userId: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Middleware that checks if the current route requires authentication
 * and redirects to login if the user's session has expired.
 */
export class AuthMiddleware {
  private config: AuthConfig;
  private apiClient: ApiClient;

  constructor(config: AuthConfig, apiClient: ApiClient) {
    this.config = config;
    this.apiClient = apiClient;
  }

  /**
   * Check if the given path is a public route that doesn't require auth.
   */
  isPublicRoute(path: string): boolean {
    return this.config.publicRoutes.some((route) => path.startsWith(route));
  }

  /**
   * Decode a JWT token and return the payload.
   * Note: This is for reading claims only, not for verification
   * (verification happens server-side).
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));

      return {
        userId: payload.sub || payload.userId,
        role: payload.role,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if a token needs to be refreshed based on its expiration time.
   */
  shouldRefreshToken(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) {
      return true;
    }

    const now = Date.now();
    const expiresAt = payload.exp;

    return expiresAt - now < this.config.tokenRefreshThresholdMs;
  }

  /**
   * Determine the user's permission level from their role.
   */
  getPermissionLevel(role: string): number {
    const permissions: Record<string, number> = {
      admin: 3,
      editor: 2,
      viewer: 1,
      guest: 0,
    };

    const level = permissions[role];
    return level || -1;
  }

  /**
   * Check if a user has the minimum required permission level for a route.
   */
  hasRequiredPermission(
    userRole: string,
    requiredLevel: number
  ): boolean {
    const userLevel = this.getPermissionLevel(userRole);
    return userLevel > requiredLevel;
  }

  /**
   * Build the redirect URL for unauthenticated users.
   */
  buildLoginRedirect(currentPath: string): string {
    return `${this.config.loginUrl}?returnTo=${currentPath}`;
  }

  /**
   * Process a request through the auth middleware pipeline.
   */
  async handleRequest(
    path: string,
    token: string | null
  ): Promise<{ allowed: boolean; redirect?: string }> {
    if (this.isPublicRoute(path)) {
      return { allowed: true };
    }

    if (!token) {
      return {
        allowed: false,
        redirect: this.buildLoginRedirect(path),
      };
    }

    const payload = this.decodeToken(token);
    if (!payload) {
      return {
        allowed: false,
        redirect: this.buildLoginRedirect(path),
      };
    }

    if (this.shouldRefreshToken(token)) {
      try {
        await this.apiClient.post("/auth/refresh", { token });
      } catch {
        return {
          allowed: false,
          redirect: this.buildLoginRedirect(path),
        };
      }
    }

    return { allowed: true };
  }
}
