import { createHash } from 'node:crypto';

export interface ReviewTicket27 {
  readonly id: number;
  readonly project: string;
  readonly assignee: string;
  readonly summary: string;
  readonly createdAt: Date;
}

type StoredTicket27 = {
  id: number;
  project: string;
  assignee: string;
  summary: string;
  createdAtMs: number;
};

function normalizeText27(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot27(ticket: StoredTicket27): ReviewTicket27 {
  return {
    id: ticket.id,
    project: ticket.project,
    assignee: ticket.assignee,
    summary: ticket.summary,
    createdAt: new Date(ticket.createdAtMs),
  };
}

function createLookupToken27(ticket: StoredTicket27): string {
  return createHash('sha256')
    .update(`${ticket.id}:${ticket.project}:${ticket.assignee}:${ticket.createdAtMs}`)
    .digest('base64url');
}

function createMatcher27(query: unknown): (ticket: StoredTicket27) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;

  const checks: Array<(ticket: StoredTicket27) => boolean> = [];
  for (const key of Object.keys(query)) {
    const value = Reflect.get(query, key);
    if (key === 'id' && typeof value === 'number') {
      checks.push(ticket => ticket.id === value);
      continue;
    }
    if ((key === 'project' || key === 'assignee' || key === 'summary') && typeof value === 'string') {
      checks.push(ticket => ticket[key] === value);
      continue;
    }
    return () => false;
  }

  if (checks.length === 0) return () => false;
  return ticket => checks.every(check => check(ticket));
}

export class ReviewSandbox27 {
  private tickets: StoredTicket27[] = [];
  private nextId = 1;

  createTicket(project: string, assignee: string, summary: string): ReviewTicket27 {
    const ticket: StoredTicket27 = {
      id: this.nextId++,
      project: normalizeText27(project) || 'default-project',
      assignee: normalizeText27(assignee) || 'unassigned',
      summary: normalizeText27(summary) || '[empty summary]',
      createdAtMs: Date.now(),
    };
    this.tickets.push(ticket);
    return snapshot27(ticket);
  }

  buildTicketUrl(baseUrl: string, ticketId: number): string {
    const ticket = this.tickets.find(item => item.id === ticketId);
    if (!ticket) return '';
    const url = new URL(`/tickets/${ticketId}`, baseUrl);
    url.hash = `ticket=${createLookupToken27(ticket)}`;
    return url.toString();
  }

  replaceTickets(query: unknown, nextSummary: string): number {
    const replacement = normalizeText27(nextSummary);
    if (!replacement) return 0;

    const matches = createMatcher27(query);
    let changed = 0;
    this.tickets = this.tickets.map(ticket => {
      if (!matches(ticket)) return ticket;
      changed++;
      return {
        ...ticket,
        summary: replacement,
      };
    });
    return changed;
  }
}
