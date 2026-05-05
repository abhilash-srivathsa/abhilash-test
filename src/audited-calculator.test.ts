declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toContain(value: unknown): void;
  toHaveLength(value: number): void;
  toThrow(value?: string): void;
};

import { AuditActor, AuditLogService } from './audit-log';
import { AuditedCalculator } from './audited-calculator';
import { Calculator } from './calculator';

const actor: AuditActor = {
  id: 'tester-1',
  name: 'Test Runner',
};

describe('AuditedCalculator', () => {
  it('records successful calculator operations', () => {
    const auditLog = new AuditLogService();
    const calculator = new AuditedCalculator(new Calculator(), auditLog);

    const result = calculator.multiply(actor, 6, 7);
    const events = auditLog.listEvents({ action: 'calculator.multiply' });

    expect(result).toBe(42);
    expect(events).toHaveLength(1);
    expect(events[0].metadata.result).toBe(42);
  });

  it('records failed division attempts before throwing', () => {
    const auditLog = new AuditLogService();
    const calculator = new AuditedCalculator(new Calculator(), auditLog);

    expect(() => calculator.divide(actor, 8, 0)).toThrow('Cannot divide by zero');

    const events = auditLog.listEvents({ status: 'failed' });
    expect(events).toHaveLength(1);
    expect(events[0].metadata.reason).toBe('division_by_zero');
  });

  it('returns cloned events so callers cannot mutate stored history', () => {
    const auditLog = new AuditLogService();
    const calculator = new AuditedCalculator(new Calculator(), auditLog);

    calculator.add(actor, 1, 2);
    const events = auditLog.listEvents();
    events[0].metadata.result = 100;

    const freshEvents = auditLog.listEvents();
    expect(freshEvents[0].metadata.result).toBe(3);
  });
});
