import {
  CreateSupportTicketInput,
  SupportTicket,
  TicketPriority,
  TicketQueueFilter,
  TicketSlaSummary,
  TicketStatus,
} from './sla-tracker';

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

  async createSupportTicket(input: CreateSupportTicketInput): Promise<ApiResponse<SupportTicket>> {
    return this.post<SupportTicket>('/support/tickets', input);
  }

  async resolveSupportTicket(ticketId: string): Promise<ApiResponse<SupportTicket>> {
    return this.post<SupportTicket>(`/support/tickets/${encodeURIComponent(ticketId)}/resolve`, {});
  }

  async getSupportTickets(filter: TicketQueueFilter = {}): Promise<ApiResponse<SupportTicket[]>> {
    const params = new URLSearchParams();

    if (filter.status) {
      params.set('status', filter.status);
    }

    if (filter.priority) {
      params.set('priority', filter.priority);
    }

    if (filter.overdueOnly !== undefined) {
      params.set('overdueOnly', String(filter.overdueOnly));
    }

    const queryString = params.toString();
    return this.get<SupportTicket[]>(`/support/tickets${queryString ? `?${queryString}` : ''}`);
  }

  async getSlaSummary(): Promise<ApiResponse<TicketSlaSummary>> {
    return this.get<TicketSlaSummary>('/support/tickets/sla-summary');
  }

  async getSupportTicketsByPriority(priority: TicketPriority): Promise<ApiResponse<SupportTicket[]>> {
    return this.getSupportTickets({ priority });
  }

  async getSupportTicketsByStatus(status: TicketStatus): Promise<ApiResponse<SupportTicket[]>> {
    return this.getSupportTickets({ status });
  }
}
