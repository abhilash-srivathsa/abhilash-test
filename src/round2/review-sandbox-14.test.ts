// @ts-nocheck

import { ReviewSandbox14 } from './review-sandbox-14';

describe('ReviewSandbox14', () => {
  it('keeps lookup metadata out of the visible query string', () => {
    const sandbox = new ReviewSandbox14();
    const record = sandbox.createRecord('red team', 'kai@example.com', 'delta echo');

    const lookup = sandbox.buildLookupUrl('https://example.com/base/', record.id);

    expect(lookup).toContain('/records/1');
    expect(lookup).toContain('#lookup=');
    expect(lookup).not.toContain('red team');
    expect(lookup).not.toContain('kai@example.com');
  });

  it('ignores malformed bulk payload entries', () => {
    const sandbox = new ReviewSandbox14();
    const loaded = sandbox.loadRecords(
      JSON.stringify([
        {
          team: 'platform',
          author: 'mina',
          body: 'queue flush',
          createdAt: '2024-02-01T00:00:00.000Z',
        },
        {
          team: 'platform',
          author: 12,
          body: 'skip me',
          createdAt: 'bad',
        },
      ])
    );

    expect(loaded).toBe(1);
    expect(sandbox.groupByTeam().platform).toHaveLength(1);
  });

  it('computes weight from shared normalized terms', () => {
    const sandbox = new ReviewSandbox14();
    const record = sandbox.createRecord('infra', 'noa', 'queue drain retry');

    const score = sandbox.calculateSearchWeight(record.id, ['retry queue', 'missing']);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
