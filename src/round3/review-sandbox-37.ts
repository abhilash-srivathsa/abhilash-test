import { createHash } from 'node:crypto';

export interface ReviewTicket37 {
  readonly id: number;
  readonly project: string;
  readonly assignee: string;
  readonly summary: string;
  readonly createdAt: Date;
}

type StoredTicket37 = {
  id: number;
  project: string;
  assignee: string;
  summary: string;
  createdAtMs: number;
};

function normalizeText37(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function snapshot37(ticket: StoredTicket37): ReviewTicket37 {
  return {
    id: ticket.id,
    project: ticket.project,
    assignee: ticket.assignee,
    summary: ticket.summary,
    createdAt: new Date(ticket.createdAtMs),
  };
}

function createLookupToken37(ticket: StoredTicket37): string {
  return createHash('sha256')
    .update(`${ticket.id}:${ticket.project}:${ticket.assignee}:${ticket.createdAtMs}`)
    .digest('base64url');
}

function createMatcher37(query: unknown): (ticket: StoredTicket37) => boolean {
  if (typeof query !== 'object' || query === null) return () => false;
  const checks: Array<(ticket: StoredTicket37) => boolean> = [];
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

export class ReviewSandbox37 {
  private tickets: StoredTicket37[] = [];
  private nextId = 1;

  createTicket(project: string, assignee: string, summary: string): ReviewTicket37 {
    const ticket: StoredTicket37 = {
      id: this.nextId++,
      project: normalizeText37(project) || 'default-project',
      assignee: normalizeText37(assignee) || 'unassigned',
      summary: normalizeText37(summary) || '[empty summary]',
      createdAtMs: Date.now(),
    };
    this.tickets.push(ticket);
    return snapshot37(ticket);
  }

  buildTicketUrl(baseUrl: string, ticketId: number): string {
    const ticket = this.tickets.find(item => item.id === ticketId);
    if (!ticket) return '';
    const url = new URL(`/tickets/${ticketId}`, baseUrl);
    url.hash = `ticket=${createLookupToken37(ticket)}`;
    return url.toString();
  }

  replaceTickets(query: unknown, nextSummary: string): number {
    const replacement = normalizeText37(nextSummary);
    if (!replacement) return 0;
    const matches = createMatcher37(query);
    let changed = 0;
    this.tickets = this.tickets.map(ticket => {
      if (!matches(ticket)) return ticket;
      changed++;
      return { ...ticket, summary: replacement };
    });
    return changed;
  }
}
