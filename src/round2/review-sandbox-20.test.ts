declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toContain(value: unknown): void;
  not: { toContain(value: unknown): void };
  toBeGreaterThan(value: number): void;
  toHaveLength(value: number): void;
};

import { ReviewSandbox20 } from './review-sandbox-20';

describe('ReviewSandbox20', () => {
  it('uses opaque lookup hashes instead of exposing metadata', () => {
    const sandbox = new ReviewSandbox20();
    const record = sandbox.createRecord('alerts', 'maya@example.com', 'queue retry');

    const url = sandbox.buildLookupUrl('https://example.com/base/', record.id);
    const parsed = new URL(url);

    expect(url).toContain(`/messages/${record.id}`);
    expect(parsed.hash.length).toBeGreaterThan(8);
    expect(url).not.toContain('alerts');
    expect(url).not.toContain('maya@example.com');
  });

  it('imports only structurally valid records', () => {
    const sandbox = new ReviewSandbox20();
    const loaded = sandbox.importRecords(
      JSON.stringify([
        {
          stream: 'ops',
          reporter: 'jo',
          message: 'retry failed webhook',
          createdAt: '2024-04-01T00:00:00.000Z',
        },
        {
          stream: 'ops',
          reporter: 12,
          message: 'ignored',
          createdAt: 'bad',
        },
      ])
    );

    expect(loaded).toBe(1);
    expect(sandbox.groupByStream().ops).toHaveLength(1);
  });

  it('scores by token overlap rather than regex matching', () => {
    const sandbox = new ReviewSandbox20();
    const record = sandbox.createRecord('queue', 'ivy', 'drain queue retry');

    const score = sandbox.weightMessage(record.id, 'retry queue');

    expect(score).toBe(1);
    expect(sandbox.weightMessage(record.id, 'retr.*')).toBe(0);
  });
});
