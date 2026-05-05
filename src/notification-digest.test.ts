declare function describe(name: string, run: () => void): void;
declare function it(name: string, run: () => void): void;
declare function expect(value: unknown): {
  toBe(value: unknown): void;
  toContain(value: unknown): void;
  toHaveLength(value: number): void;
  toThrow(value?: string): void;
};

import { NotificationDigestService } from './notification-digest';

describe('NotificationDigestService', () => {
  it('builds prioritized digest previews for unread messages', () => {
    const service = new NotificationDigestService();
    service.createSubscriber({ id: 'sub-1', email: 'reader@example.com' });

    service.queueNotification({
      subscriberId: 'sub-1',
      title: 'Normal update',
      body: 'A regular notification',
    });
    service.queueNotification({
      subscriberId: 'sub-1',
      title: 'Urgent update',
      body: 'A high-priority notification',
      priority: 'high',
    });

    const digest = service.buildDigest('sub-1');

    expect(digest?.messageCount).toBe(2);
    expect(digest?.highPriorityCount).toBe(1);
    expect(digest?.messages[0].title).toBe('Urgent update');
  });

  it('excludes read messages from ready digests', () => {
    const service = new NotificationDigestService();
    service.createSubscriber({
      id: 'sub-2',
      email: 'weekly@example.com',
      frequency: 'weekly',
    });
    const message = service.queueNotification({
      subscriberId: 'sub-2',
      title: 'Already seen',
      body: 'This should not appear',
    });

    service.markRead(message.id);

    expect(service.listReadyDigests('weekly')).toHaveLength(0);
  });

  it('rejects invalid subscribers and missing message content', () => {
    const service = new NotificationDigestService();

    expect(() => service.createSubscriber({ id: 'bad', email: 'not-valid' })).toThrow(
      'A valid subscriber email is required'
    );

    service.createSubscriber({ id: 'sub-3', email: 'valid@example.com' });

    expect(() =>
      service.queueNotification({
        subscriberId: 'sub-3',
        title: '',
        body: 'Missing title',
      })
    ).toThrow('Notification title and body are required');
  });
});
