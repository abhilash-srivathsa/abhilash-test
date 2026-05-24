declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toHaveLength(value: number): void;
  toThrow(value?: string): void;
};

import { FeatureFlagService } from './feature-flags';

describe('FeatureFlagService', () => {
  it('evaluates allowed users before percentage rollout', () => {
    const service = new FeatureFlagService();
    service.createFlag({
      key: 'new-dashboard',
      description: 'Enable the new dashboard',
      rolloutPercentage: 0,
    });
    service.updateFlag('new-dashboard', {
      status: 'active',
      allowedUserIds: ['user-1'],
    });

    const evaluation = service.evaluateFlag('new-dashboard', 'user-1');

    expect(evaluation.variation).toBe('enabled');
    expect(evaluation.reason).toBe('user_allowed');
  });

  it('blocks users even when rollout is fully enabled', () => {
    const service = new FeatureFlagService();
    service.createFlag({
      key: 'checkout-v2',
      description: 'Enable checkout flow',
      rolloutPercentage: 100,
    });
    service.updateFlag('checkout-v2', {
      status: 'active',
      blockedUserIds: ['user-2'],
    });

    const evaluation = service.evaluateFlag('checkout-v2', 'user-2');

    expect(evaluation.variation).toBe('control');
    expect(evaluation.reason).toBe('user_blocked');
  });

  it('filters flags by status', () => {
    const service = new FeatureFlagService();
    service.createFlag({ key: 'draft-flag', description: 'Draft' });
    service.createFlag({ key: 'active-flag', description: 'Active', rolloutPercentage: 50 });
    service.updateFlag('active-flag', { status: 'active' });

    expect(service.listFlags('active')).toHaveLength(1);
  });

  it('rejects invalid keys and rollout percentages', () => {
    const service = new FeatureFlagService();

    expect(() => service.createFlag({ key: 'Bad Key', description: 'Invalid' })).toThrow(
      'Feature flag key must use lowercase letters, numbers, and hyphens'
    );
    expect(() =>
      service.createFlag({ key: 'too-large', description: 'Invalid', rolloutPercentage: 101 })
    ).toThrow('Rollout percentage must be between 0 and 100');
  });
});
