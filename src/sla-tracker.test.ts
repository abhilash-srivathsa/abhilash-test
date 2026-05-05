declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toHaveLength(value: number): void;
  toThrow(value?: string): void;
};

import { SlaTrackerService } from './sla-tracker';

describe('SlaTrackerService', () => {
  it('creates tickets with priority-based due dates', () => {
    const service = new SlaTrackerService();

    const ticket = service.createTicket({
      title: 'Production incident',
      requester: { name: 'Ari', email: 'ari@example.com' },
      priority: 'urgent',
    });

    const hoursUntilDue = Math.round((ticket.dueAt.getTime() - ticket.createdAt.getTime()) / 3600000);
    expect(ticket.status).toBe('open');
    expect(hoursUntilDue).toBe(4);
  });

  it('marks overdue tickets as breached and updates the queue summary', () => {
    const service = new SlaTrackerService();
    const ticket = service.createTicket({
      title: 'Delayed response',
      requester: { name: 'Mina', email: 'mina@example.com' },
      priority: 'high',
    });
    const afterDueDate = new Date(ticket.dueAt.getTime() + 1000);

    const breachedTickets = service.markBreachedTickets(afterDueDate);
    const summary = service.summarizeQueue(afterDueDate);

    expect(breachedTickets).toHaveLength(1);
    expect(summary.breachedCount).toBe(1);
  });

  it('filters resolved tickets out of active queue counts', () => {
    const service = new SlaTrackerService();
    const ticket = service.createTicket({
      title: 'Billing question',
      requester: { name: 'Noa', email: 'noa@example.com' },
    });

    service.resolveTicket(ticket.id);

    expect(service.summarizeQueue().openCount).toBe(0);
  });

  it('rejects invalid ticket input', () => {
    const service = new SlaTrackerService();

    expect(() =>
      service.createTicket({
        title: '',
        requester: { name: 'Lee', email: 'lee@example.com' },
      })
    ).toThrow('Ticket title is required');

    expect(() =>
      service.createTicket({
        title: 'Needs help',
        requester: { name: '', email: 'bad-email' },
      })
    ).toThrow('A valid requester name and email are required');
  });
});
