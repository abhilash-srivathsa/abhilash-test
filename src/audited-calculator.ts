import { AuditActor, AuditLogService } from './audit-log';
import { Calculator } from './calculator';

export class AuditedCalculator {
  constructor(
    private readonly calculator: Calculator,
    private readonly auditLog: AuditLogService
  ) {}

  add(actor: AuditActor, a: number, b: number): number {
    const result = this.calculator.add(a, b);
    this.auditLog.recordEvent({
      action: 'calculator.add',
      actor,
      status: 'success',
      metadata: { a, b, result },
    });
    return result;
  }

  subtract(actor: AuditActor, a: number, b: number): number {
    const result = this.calculator.subtract(a, b);
    this.auditLog.recordEvent({
      action: 'calculator.subtract',
      actor,
      status: 'success',
      metadata: { a, b, result },
    });
    return result;
  }

  multiply(actor: AuditActor, a: number, b: number): number {
    const result = this.calculator.multiply(a, b);
    this.auditLog.recordEvent({
      action: 'calculator.multiply',
      actor,
      status: 'success',
      metadata: { a, b, result },
    });
    return result;
  }

  divide(actor: AuditActor, a: number, b: number): number {
    if (b === 0) {
      this.auditLog.recordEvent({
        action: 'calculator.divide',
        actor,
        status: 'failed',
        metadata: { a, b, reason: 'division_by_zero' },
      });
      throw new Error('Cannot divide by zero');
    }

    const result = this.calculator.divide(a, b);
    this.auditLog.recordEvent({
      action: 'calculator.divide',
      actor,
      status: 'success',
      metadata: { a, b, result },
    });
    return result;
  }
}
