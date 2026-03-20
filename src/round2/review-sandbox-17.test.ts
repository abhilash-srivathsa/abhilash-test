declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toContain(value: unknown): void;
  toBeGreaterThan(value: number): void;
  toHaveLength(value: number): void;
};

import { ReviewSandbox17 } from './review-sandbox-17';

describe('ReviewSandbox17', () => {
  it('builds lookup URLs for created records', () => {
    const sandbox = new ReviewSandbox17();
    const record = sandbox.createRecord('core', 'lee', 'fix flaky run');

    const url = sandbox.buildLookupUrl('https://example.com', record.id);

    expect(url).toContain('/items/1');
    expect(url).not.toContain('workspace=core');
  });

  it('loads array payloads and groups by workspace', () => {
    const sandbox = new ReviewSandbox17();
    const loaded = sandbox.loadRecords(
      JSON.stringify([
        {
          workspace: 'docs',
          owner: 'ria',
          content: 'update examples',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ])
    );

    expect(loaded).toBe(1);
    expect(sandbox.groupByWorkspace().docs).toHaveLength(1);
  });

  it('scores content matches', () => {
    const sandbox = new ReviewSandbox17();
    const record = sandbox.createRecord('ops', 'sam', 'restart queue worker');

    const score = sandbox.scoreContent(record.id, ['queue', 'worker']);

    expect(score).toBeGreaterThan(0);
  });
});
