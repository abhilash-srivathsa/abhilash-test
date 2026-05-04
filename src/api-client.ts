import { CreateUserInput, User, UserPreferences, UserSearchOptions } from './user-service';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json() as T;

      return {
        data: data,
        status: response.status,
        message: 'Success',
      };
    } catch (error: unknown) {
      throw Object.assign(new Error('API request failed'), { cause: error });
    }
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Missing error handling
    const data = await response.json() as T;

    return {
      data: data,
      status: response.status,
      message: 'Success',
    };
  }

  async delete(endpoint: string): Promise<boolean> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    return response.ok;
  }

  async createUser(input: CreateUserInput): Promise<ApiResponse<User>> {
    return this.post<User>('/users', input);
  }

  async activateUser(userId: string): Promise<ApiResponse<User>> {
    return this.post<User>(`/users/${userId}/activate`, {});
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<ApiResponse<User>> {
    return this.post<User>(`/users/${userId}/preferences`, preferences);
  }

  async searchUsers(options: UserSearchOptions = {}): Promise<ApiResponse<User[]>> {
    const params = new URLSearchParams();

    if (options.status) {
      params.set('status', options.status);
    }

    if (options.marketingEmails !== undefined) {
      params.set('marketingEmails', String(options.marketingEmails));
    }

    const query = params.toString();
    return this.get<User[]>(`/users${query ? `?${query}` : ''}`);
  }
}
