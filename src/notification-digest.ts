import { formatDate, isValidEmail } from './utils';

export type DigestChannel = 'email' | 'sms';
export type DigestFrequency = 'daily' | 'weekly';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface DigestSubscriber {
  readonly id: string;
  readonly email: string;
  readonly channel: DigestChannel;
  readonly frequency: DigestFrequency;
  readonly active: boolean;
}

export interface NotificationMessage {
  readonly id: string;
  readonly subscriberId: string;
  readonly title: string;
  readonly body: string;
  readonly priority: NotificationPriority;
  readonly createdAt: Date;
  readonly read: boolean;
}

export interface CreateSubscriberInput {
  readonly id: string;
  readonly email: string;
  readonly channel?: DigestChannel;
  readonly frequency?: DigestFrequency;
}

export interface CreateNotificationInput {
  readonly subscriberId: string;
  readonly title: string;
  readonly body: string;
  readonly priority?: NotificationPriority;
}

export interface DigestPreview {
  readonly subscriber: DigestSubscriber;
  readonly subject: string;
  readonly messageCount: number;
  readonly highPriorityCount: number;
  readonly generatedOn: string;
  readonly messages: readonly NotificationMessage[];
}

export class NotificationDigestService {
  private readonly subscribers = new Map<string, DigestSubscriber>();
  private readonly messages = new Map<string, NotificationMessage>();

  createSubscriber(input: CreateSubscriberInput): DigestSubscriber {
    if (!input.id.trim()) {
      throw new Error('Subscriber id is required');
    }

    if (!isValidEmail(input.email)) {
      throw new Error('A valid subscriber email is required');
    }

    const subscriber: DigestSubscriber = {
      id: input.id,
      email: input.email,
      channel: input.channel ?? 'email',
      frequency: input.frequency ?? 'daily',
      active: true,
    };

    this.subscribers.set(subscriber.id, subscriber);
    return subscriber;
  }

  deactivateSubscriber(id: string): boolean {
    const subscriber = this.subscribers.get(id);
    if (!subscriber) {
      return false;
    }

    this.subscribers.set(id, { ...subscriber, active: false });
    return true;
  }

  queueNotification(input: CreateNotificationInput): NotificationMessage {
    if (!this.subscribers.has(input.subscriberId)) {
      throw new Error('Subscriber must exist before queueing notifications');
    }

    if (!input.title.trim() || !input.body.trim()) {
      throw new Error('Notification title and body are required');
    }

    const message: NotificationMessage = {
      id: `${input.subscriberId}-${Date.now()}-${this.messages.size + 1}`,
      subscriberId: input.subscriberId,
      title: input.title,
      body: input.body,
      priority: input.priority ?? 'normal',
      createdAt: new Date(),
      read: false,
    };

    this.messages.set(message.id, message);
    return message;
  }

  markRead(messageId: string): NotificationMessage | null {
    const message = this.messages.get(messageId);
    if (!message) {
      return null;
    }

    const updatedMessage = { ...message, read: true };
    this.messages.set(messageId, updatedMessage);
    return updatedMessage;
  }

  buildDigest(subscriberId: string): DigestPreview | null {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber || !subscriber.active) {
      return null;
    }

    const unreadMessages = Array.from(this.messages.values())
      .filter(message => message.subscriberId === subscriberId && !message.read)
      .sort((left, right) => this.priorityRank(right.priority) - this.priorityRank(left.priority));

    return {
      subscriber,
      subject: this.buildSubject(subscriber, unreadMessages.length),
      messageCount: unreadMessages.length,
      highPriorityCount: unreadMessages.filter(message => message.priority === 'high').length,
      generatedOn: formatDate(new Date()),
      messages: unreadMessages,
    };
  }

  listReadyDigests(frequency: DigestFrequency): DigestPreview[] {
    return Array.from(this.subscribers.values())
      .filter(subscriber => subscriber.active && subscriber.frequency === frequency)
      .map(subscriber => this.buildDigest(subscriber.id))
      .filter((digest): digest is DigestPreview => digest !== null && digest.messageCount > 0);
  }

  private buildSubject(subscriber: DigestSubscriber, count: number): string {
    const label = count === 1 ? 'notification' : 'notifications';
    return `${count} ${subscriber.frequency} ${label} for ${subscriber.email}`;
  }

  private priorityRank(priority: NotificationPriority): number {
    if (priority === 'high') {
      return 3;
    }

    if (priority === 'normal') {
      return 2;
    }

    return 1;
  }
}
