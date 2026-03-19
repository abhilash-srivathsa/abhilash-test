// @ts-nocheck

import { ReviewSandbox16 } from './review-sandbox-16';

describe('ReviewSandbox16', () => {
  it('encodes lookup details into path segments instead of query params', () => {
    const sandbox = new ReviewSandbox16();
    const record = sandbox.createRecord('red team', 'kai@example.com', 'delta echo');

    const lookup = sandbox.buildLookupUrl('https://example.com/base/', record.id);

    expect(lookup).toContain('/records/1/team/red%2520team/author/kai%2540example.com');
    expect(lookup).not.toContain('?team=');
  });

  it('rejects invalid imported entries', () => {
    const sandbox = new ReviewSandbox16();
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
});
