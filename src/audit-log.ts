import { formatDateTime, generateId } from './utils';

export type AuditAction = 'calculator.add' | 'calculator.subtract' | 'calculator.multiply' | 'calculator.divide';
export type AuditStatus = 'success' | 'failed';

export interface AuditActor {
  readonly id: string;
  readonly name: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly action: AuditAction;
  readonly actor: AuditActor;
  readonly status: AuditStatus;
  readonly occurredAt: Date;
  readonly metadata: Record<string, string | number | boolean>;
}

export interface AuditEventSummary {
  readonly id: string;
  readonly action: AuditAction;
  readonly actorName: string;
  readonly status: AuditStatus;
  readonly occurredOn: string;
}

export interface CreateAuditEventInput {
  readonly action: AuditAction;
  readonly actor: AuditActor;
  readonly status: AuditStatus;
  readonly metadata?: Record<string, string | number | boolean>;
}

export interface AuditEventQuery {
  readonly action?: AuditAction;
  readonly actorId?: string;
  readonly status?: AuditStatus;
}

export function serializeAuditEvent(event: AuditEvent): Record<string, unknown> {
  return {
    ...event,
    occurredAt: event.occurredAt.toISOString(),
  };
}

export interface AuditActionRollup {
  readonly action: AuditAction;
  readonly successCount: number;
  readonly failureCount: number;
}

interface MutableAuditActionRollup {
  action: AuditAction;
  successCount: number;
  failureCount: number;
}

export function summarizeAuditEvent(event: AuditEvent): AuditEventSummary {
  return {
    id: event.id,
    action: event.action,
    actorName: event.actor.name,
    status: event.status,
    occurredOn: formatDateTime(event.occurredAt),
  };
}

export class AuditLogService {
  private readonly events: AuditEvent[] = [];

  recordEvent(input: CreateAuditEventInput): AuditEvent {
    const event: AuditEvent = {
      id: generateId(),
      action: input.action,
      actor: input.actor,
      status: input.status,
      occurredAt: new Date(),
      metadata: input.metadata ?? {},
    };

    this.events.push(this.cloneEvent(event));
    return this.cloneEvent(event);
  }

  listEvents(query: AuditEventQuery = {}): AuditEvent[] {
    return this.events.filter(event => {
      if (query.action && event.action !== query.action) {
        return false;
      }

      if (query.actorId && event.actor.id !== query.actorId) {
        return false;
      }

      if (query.status && event.status !== query.status) {
        return false;
      }

      return true;
    }).map(event => this.cloneEvent(event));
  }

  listSummaries(query: AuditEventQuery = {}): AuditEventSummary[] {
    return this.listEvents(query).map(summarizeAuditEvent);
  }

  summarizeByAction(): AuditActionRollup[] {
    const rollups = new Map<AuditAction, MutableAuditActionRollup>();

    for (const event of this.events) {
      const current = rollups.get(event.action) ?? {
        action: event.action,
        successCount: 0,
        failureCount: 0,
      };

      if (event.status === 'success') {
        current.successCount += 1;
      } else {
        current.failureCount += 1;
      }

      rollups.set(event.action, current);
    }

    return Array.from(rollups.values());
  }

  private cloneEvent(event: AuditEvent): AuditEvent {
    return {
      ...event,
      actor: { ...event.actor },
      occurredAt: new Date(event.occurredAt),
      metadata: { ...event.metadata },
    };
  }
}
