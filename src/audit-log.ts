import { formatDateTime } from './utils';

export type AuditAction = 'calculator.add' | 'calculator.subtract' | 'calculator.multiply' | 'calculator.divide';
export type AuditStatus = 'success' | 'failed';

export interface AuditActor {
  id: string;
  name: string;
}

export interface AuditEvent {
  id: string;
  action: AuditAction;
  actor: AuditActor;
  status: AuditStatus;
  occurredAt: Date;
  metadata: Record<string, string | number | boolean>;
}

export interface AuditEventSummary {
  id: string;
  action: AuditAction;
  actorName: string;
  status: AuditStatus;
  occurredOn: string;
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
