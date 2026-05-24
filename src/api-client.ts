import {
  CreateNotificationInput,
  CreateSubscriberInput,
  DigestFrequency,
  DigestPreview,
  DigestSubscriber,
  NotificationMessage,
} from './notification-digest';

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

  async createDigestSubscriber(input: CreateSubscriberInput): Promise<ApiResponse<DigestSubscriber>> {
    return this.post<DigestSubscriber>('/notification-digests/subscribers', input);
  }

  async queueNotification(input: CreateNotificationInput): Promise<ApiResponse<NotificationMessage>> {
    return this.post<NotificationMessage>('/notification-digests/messages', input);
  }

  async getDigestPreview(subscriberId: string): Promise<ApiResponse<DigestPreview>> {
    return this.get<DigestPreview>(
      `/notification-digests/subscribers/${encodeURIComponent(subscriberId)}/preview`
    );
  }

  async getReadyDigests(frequency: DigestFrequency): Promise<ApiResponse<DigestPreview[]>> {
    return this.get<DigestPreview[]>(`/notification-digests/ready?frequency=${frequency}`);
  }
}
