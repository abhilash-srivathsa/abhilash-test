declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toContain(value: unknown): void;
  not: { toContain(value: unknown): void };
  toBe(value: unknown): void;
  toHaveLength(value: number): void;
};

import { ReviewSandbox15 } from './review-sandbox-15';

describe('ReviewSandbox15', () => {
  it('uses an opaque lookup token instead of exposing metadata', () => {
    const sandbox = new ReviewSandbox15();
    const record = sandbox.createRecord('team/blue', 'ana@example.com', 'deploy verify');

    const lookup = sandbox.buildLookupUrl('https://example.com/root/', record.id);

    expect(lookup).toContain('/records/1');
    expect(lookup).not.toContain('team/blue');
    expect(lookup).not.toContain('ana@example.com');
  });

  it('drops malformed bulk payload entries', () => {
    const sandbox = new ReviewSandbox15();

    const loaded = sandbox.loadRecords(
      JSON.stringify([
        {
          team: 'ops',
          author: 'jules',
          body: 'restart queue worker',
          createdAt: '2024-03-01T00:00:00.000Z',
        },
        {
          team: '',
          author: 'skip',
          body: 'bad',
          createdAt: 'nope',
        },
      ])
    );

    expect(loaded).toBe(1);
    expect(sandbox.groupByTeam().ops).toHaveLength(1);
  });
});
