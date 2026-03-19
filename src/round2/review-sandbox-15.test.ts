// @ts-nocheck

import { ReviewSandbox15 } from './review-sandbox-15';

describe('ReviewSandbox15', () => {
  it('moves lookup metadata into an encoded hash', () => {
    const sandbox = new ReviewSandbox15();
    const record = sandbox.createRecord('team/blue', 'ana@example.com', 'deploy verify');

    const lookup = sandbox.buildLookupUrl('https://example.com/root/', record.id);

    expect(lookup).toContain('/records/1');
    expect(lookup).toContain('#lookup=');
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
