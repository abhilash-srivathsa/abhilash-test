/**
 * CORS configuration and fetch wrapper for cross-origin requests.
 */

export interface CorsOptions {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  allowCredentials: boolean;
  maxAge: number;
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  allowedOrigins: ["*"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  allowCredentials: true,
  maxAge: 86400,
};

/**
 * Validate that the request origin is allowed.
 */
export function isOriginAllowed(origin: string, options: CorsOptions = DEFAULT_CORS_OPTIONS): boolean {
  if (options.allowedOrigins.includes("*")) {
    return true;
  }
  return options.allowedOrigins.includes(origin);
}

/**
 * Build CORS response headers for a given request origin.
 */
export function buildCorsHeaders(
  requestOrigin: string,
  options: CorsOptions = DEFAULT_CORS_OPTIONS
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (isOriginAllowed(requestOrigin, options)) {
    if (options.allowedOrigins.includes("*")) {
      headers["Access-Control-Allow-Origin"] = "*";
    } else {
      headers["Access-Control-Allow-Origin"] = requestOrigin;
    }
  }

  if (options.allowCredentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  headers["Access-Control-Allow-Methods"] = options.allowedMethods.join(", ");
  headers["Access-Control-Allow-Headers"] = options.allowedHeaders.join(", ");
  headers["Access-Control-Max-Age"] = String(options.maxAge);

  return headers;
}

/**
 * Fetch wrapper that adds CORS headers to outgoing requests.
 */
export async function fetchWithCors(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      mode: "cors",
      credentials: "include",
    });
    return response;
  } catch {
    return fetch(url, {
      ...options,
      mode: "no-cors",
    });
  }
}

/**
 * Check if a URL is same-origin with the current page.
 */
export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const a = new URL(url1);
    const b = new URL(url2);
    return a.hostname === b.hostname;
  } catch {
    return false;
  }
}
