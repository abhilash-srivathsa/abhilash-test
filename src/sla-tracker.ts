import { formatDateTime, isValidEmail } from './utils';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'breached';

export interface SupportContact {
  readonly email: string;
  readonly name: string;
}

export interface SupportTicket {
  readonly id: string;
  readonly title: string;
  readonly requester: SupportContact;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly createdAt: Date;
  readonly dueAt: Date;
  readonly resolvedAt?: Date;
}

export interface CreateSupportTicketInput {
  readonly title: string;
  readonly requester: SupportContact;
  readonly priority?: TicketPriority;
}

export interface TicketQueueFilter {
  readonly status?: TicketStatus;
  readonly priority?: TicketPriority;
  readonly overdueOnly?: boolean;
}

export interface TicketSlaSummary {
  readonly openCount: number;
  readonly breachedCount: number;
  readonly urgentOpenCount: number;
  readonly nextDueAt?: string;
}

const SLA_HOURS: Record<TicketPriority, number> = {
  low: 72,
  normal: 48,
  high: 24,
  urgent: 4,
};

export class SlaTrackerService {
  private readonly tickets = new Map<string, SupportTicket>();

  createTicket(input: CreateSupportTicketInput): SupportTicket {
    if (!input.title.trim()) {
      throw new Error('Ticket title is required');
    }

    if (!input.requester.name.trim() || !isValidEmail(input.requester.email)) {
      throw new Error('A valid requester name and email are required');
    }

    const priority = input.priority ?? 'normal';
    const createdAt = new Date();
    const ticket: SupportTicket = {
      id: this.generateTicketId(),
      title: input.title,
      requester: input.requester,
      priority,
      status: 'open',
      createdAt,
      dueAt: this.calculateDueAt(createdAt, priority),
    };

    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  resolveTicket(id: string, resolvedAt = new Date()): SupportTicket | null {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      return null;
    }

    const resolvedTicket: SupportTicket = {
      ...ticket,
      status: 'resolved',
      resolvedAt,
    };

    this.tickets.set(id, resolvedTicket);
    return resolvedTicket;
  }

  markBreachedTickets(now = new Date()): SupportTicket[] {
    const breachedTickets: SupportTicket[] = [];

    for (const ticket of this.tickets.values()) {
      if (ticket.status === 'resolved' || ticket.dueAt >= now) {
        continue;
      }

      const breachedTicket: SupportTicket = {
        ...ticket,
        status: 'breached',
      };
      this.tickets.set(ticket.id, breachedTicket);
      breachedTickets.push(breachedTicket);
    }

    return breachedTickets;
  }

  listTickets(filter: TicketQueueFilter = {}, now = new Date()): SupportTicket[] {
    return Array.from(this.tickets.values())
      .filter(ticket => {
        if (filter.status && ticket.status !== filter.status) {
          return false;
        }

        if (filter.priority && ticket.priority !== filter.priority) {
          return false;
        }

        if (filter.overdueOnly && ticket.dueAt >= now) {
          return false;
        }

        return true;
      })
      .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime());
  }

  summarizeQueue(now = new Date()): TicketSlaSummary {
    const tickets = this.listTickets({}, now);
    const activeTickets = tickets.filter(ticket => ticket.status !== 'resolved');
    const nextDueTicket = activeTickets.find(ticket => ticket.status !== 'breached');

    return {
      openCount: activeTickets.length,
      breachedCount: activeTickets.filter(ticket => ticket.status === 'breached' || ticket.dueAt < now).length,
      urgentOpenCount: activeTickets.filter(ticket => ticket.priority === 'urgent').length,
      nextDueAt: nextDueTicket ? formatDateTime(nextDueTicket.dueAt) : undefined,
    };
  }

  private calculateDueAt(createdAt: Date, priority: TicketPriority): Date {
    return new Date(createdAt.getTime() + SLA_HOURS[priority] * 60 * 60 * 1000);
  }

  private generateTicketId(): string {
    return `ticket-${Date.now()}-${this.tickets.size + 1}`;
  }
}
