// Simple HTTP client wrapper

interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
}

// BUG: no input validation on URL - SSRF vulnerability
// BUG: no timeout by default - hangs forever
// BUG: credentials leaked in error messages
export async function fetchJSON(url: string, options: Partial<RequestOptions> = {}): Promise<any> {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // BUG: doesn't check response.ok - treats 4xx/5xx as success
  return response.json();
}

// BUG: builds query string without encoding special characters
export function buildURL(base: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`) // BUG: no encodeURIComponent
    .join('&');
  return `${base}?${query}`;
}

// BUG: retry with no backoff - hammers server
// BUG: retries non-idempotent methods (POST, DELETE)
export async function fetchWithRetry(url: string, retries: number = 3): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchJSON(url);
    } catch (error) {
      if (i === retries) throw error;
      // BUG: no delay between retries
    }
  }
}

// BUG: authorization header exposed in logs
export function createAuthHeaders(token: string): Record<string, string> {
  console.log(`Creating auth headers for token: ${token}`); // BUG: logs sensitive data
  return {
    Authorization: `Bearer ${token}`,
  };
}
