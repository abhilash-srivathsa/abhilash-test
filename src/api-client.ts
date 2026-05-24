import { AuditActionRollup, AuditEvent, AuditEventQuery, CreateAuditEventInput } from './audit-log';

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

  async recordAuditEvent(input: CreateAuditEventInput): Promise<ApiResponse<AuditEvent>> {
    return this.post<AuditEvent>('/audit/events', input);
  }

  async getAuditEvents(query: AuditEventQuery = {}): Promise<ApiResponse<AuditEvent[]>> {
    const params = new URLSearchParams();

    if (query.action) {
      params.set('action', query.action);
    }

    if (query.actorId) {
      params.set('actorId', query.actorId);
    }

    if (query.status) {
      params.set('status', query.status);
    }

    const queryString = params.toString();
    return this.get<AuditEvent[]>(`/audit/events${queryString ? `?${queryString}` : ''}`);
  }

  async getAuditRollups(): Promise<ApiResponse<AuditActionRollup[]>> {
    return this.get<AuditActionRollup[]>('/audit/rollups');
  }
}
