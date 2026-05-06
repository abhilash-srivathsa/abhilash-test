import {
  CreateFeatureFlagInput,
  FeatureFlag,
  FeatureFlagEvaluation,
  FeatureFlagStatus,
  UpdateFeatureFlagInput,
} from './feature-flags';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

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

      const data = await response.json();

      return {
        data: data,
        status: response.status,
        message: 'Success',
      };
    } catch (error) {
      throw new Error(`API request failed: ${error}`);
    }
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
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
    const data = await response.json();

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

  async createFeatureFlag(input: CreateFeatureFlagInput): Promise<ApiResponse<FeatureFlag>> {
    return this.post<FeatureFlag>('/feature-flags', input);
  }

  async updateFeatureFlag(
    key: string,
    input: UpdateFeatureFlagInput
  ): Promise<ApiResponse<FeatureFlag>> {
    return this.post<FeatureFlag>(`/feature-flags/${encodeURIComponent(key)}`, input);
  }

  async evaluateFeatureFlag(
    key: string,
    userId: string
  ): Promise<ApiResponse<FeatureFlagEvaluation>> {
    const params = new URLSearchParams({ userId });
    return this.get<FeatureFlagEvaluation>(
      `/feature-flags/${encodeURIComponent(key)}/evaluate?${params.toString()}`
    );
  }

  async getFeatureFlags(status?: FeatureFlagStatus): Promise<ApiResponse<FeatureFlag[]>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.get<FeatureFlag[]>(`/feature-flags${query}`);
  }
}
