declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void | Promise<void>): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toEqual(value: unknown): void;
  toHaveLength(value: number): void;
};

import { UserEngagementWorkflow } from './user-engagement';
import { UserService } from './user-service';

describe('UserEngagementWorkflow', () => {
  it('registers a local user without remote sync by default', async () => {
    const service = new UserService();
    const workflow = new UserEngagementWorkflow(service);

    const result = await workflow.registerUser({
      name: 'Mina',
      email: 'mina@example.com',
      age: 24,
      preferences: {
        timezone: 'America/Los_Angeles',
      },
    });

    expect(result.synced).toBe(false);
    expect(result.localUser.status).toBe('pending');
    expect(result.localUser.preferences.timezone).toBe('America/Los_Angeles');
  });

  it('activates pending users who meet product update eligibility', async () => {
    const service = new UserService();
    const workflow = new UserEngagementWorkflow(service);

    await workflow.registerUser({
      name: 'Noa',
      email: 'noa@example.com',
      age: 17,
    });
    await workflow.registerUser({
      name: 'Ari',
      email: 'ari@example.com',
      age: 11,
    });

    const activatedUsers = await workflow.activateEligibleUsers();

    expect(activatedUsers).toHaveLength(1);
    expect(activatedUsers[0].status).toBe('active');
  });

  it('normalizes unsupported marketing opt-in timezones', async () => {
    const service = new UserService();
    const workflow = new UserEngagementWorkflow(service);
    const result = await workflow.registerUser({
      name: 'Lee',
      email: 'lee@example.com',
      age: 29,
    });

    const user = await workflow.optInToMarketing(result.localUser.id, 'Invalid/Zone');

    expect(user?.preferences.marketingEmails).toBe(true);
    expect(user?.preferences.timezone).toBe('UTC');
  });
});
