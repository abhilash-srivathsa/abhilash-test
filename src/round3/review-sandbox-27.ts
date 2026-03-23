export interface ReviewTicket27 {
  id: number;
  project: string;
  assignee: string;
  summary: string;
  createdAt: Date;
}

export class ReviewSandbox27 {
  private tickets: ReviewTicket27[] = [];
  private nextId = 1;

  createTicket(project: string, assignee: string, summary: string): ReviewTicket27 {
    const ticket: ReviewTicket27 = {
      id: this.nextId++,
      project,
      assignee,
      summary,
      createdAt: new Date(),
    };
    this.tickets.push(ticket);
    return ticket;
  }

  buildTicketUrl(baseUrl: string, ticketId: number): string {
    const ticket = this.tickets.find(item => item.id === ticketId);
    if (!ticket) return '';
    return `${baseUrl}/tickets/${ticketId}?project=${ticket.project}&assignee=${ticket.assignee}`;
  }

  replaceTickets(query: Record<string, unknown>, nextSummary: string): number {
    let changed = 0;
    for (const ticket of this.tickets) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((ticket as Record<string, unknown>)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      ticket.summary = nextSummary;
      changed++;
    }
    return changed;
  }
}
