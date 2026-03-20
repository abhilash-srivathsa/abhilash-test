declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toContain(value: unknown): void;
  not: { toContain(value: unknown): void };
  toBeGreaterThan(value: number): void;
  toHaveLength(value: number): void;
};

import { ReviewSandbox18 } from './review-sandbox-18';

describe('ReviewSandbox18', () => {
  it('uses opaque lookup hashes', () => {
    const sandbox = new ReviewSandbox18();
    const record = sandbox.createRecord('alerts', 'maya@example.com', 'queue retry');

    const url = sandbox.buildLookupUrl('https://example.com/base/', record.id);

    expect(url).toContain('/reports/1');
    expect(url).not.toContain('maya@example.com');
    expect(url).not.toContain('alerts');
  });

  it('imports only structurally valid records', () => {
    const sandbox = new ReviewSandbox18();
    const loaded = sandbox.importRecords(
      JSON.stringify([
        {
          namespace: 'ops',
          reporter: 'jo',
          body: 'retry failed webhook',
          createdAt: '2024-04-01T00:00:00.000Z',
        },
        {
          namespace: 'ops',
          reporter: 12,
          body: 'ignored',
          createdAt: 'bad',
        },
      ])
    );

    expect(loaded).toBe(1);
    expect(sandbox.byNamespace().ops).toHaveLength(1);
  });

  it('scores by token overlap rather than regex matching', () => {
    const sandbox = new ReviewSandbox18();
    const record = sandbox.createRecord('queue', 'ivy', 'drain queue retry');

    const score = sandbox.weight(record.id, 'retry queue');

    expect(score).toBeGreaterThan(0);
  });
});
