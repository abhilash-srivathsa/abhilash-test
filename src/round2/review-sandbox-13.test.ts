// @ts-nocheck

import { ReviewSandbox13 } from './review-sandbox-13';

describe('ReviewSandbox13', () => {
  it('encodes lookup metadata into the hash instead of raw query params', () => {
    const sandbox = new ReviewSandbox13();
    const record = sandbox.createRecord('team/alpha', 'ann@example.com', 'hello world');

    const lookup = sandbox.buildLookupUrl('https://example.com/app/', record.id);

    expect(lookup).toContain('/records/1');
    expect(lookup).toContain('#lookup=');
    expect(lookup).not.toContain('team/alpha');
    expect(lookup).not.toContain('ann@example.com');
  });

  it('loads only structurally valid records', () => {
    const sandbox = new ReviewSandbox13();
    const loaded = sandbox.loadRecords(
      JSON.stringify([
        {
          team: 'ops',
          author: 'lee',
          body: 'deploy checklist',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
        {
          team: '',
          author: 'lee',
          body: 'ignored',
          createdAt: 'bad',
        },
      ])
    );

    expect(loaded).toBe(1);
    expect(sandbox.groupByTeam().ops).toHaveLength(1);
  });

  it('scores token overlap instead of regex matches', () => {
    const sandbox = new ReviewSandbox13();
    const record = sandbox.createRecord('qa', 'sam', 'alpha beta gamma');

    const score = sandbox.calculateSearchWeight(record.id, ['alpha', 'gamma delta']);

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
