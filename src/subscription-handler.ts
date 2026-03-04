/**
 * Handles webhook events for subscription lifecycle (create, renew, cancel).
 */

export interface SubscriptionEvent {
  eventId: string;
  type: "created" | "renewed" | "cancelled" | "payment_failed";
  subscriptionId: string;
  userId: string;
  timestamp: number;
}

export interface SubscriptionState {
  id: string;
  userId: string;
  status: "active" | "cancelled" | "past_due" | "pending";
  currentPeriodEnd: number;
}

export class SubscriptionHandler {
  private subscriptions: Map<string, SubscriptionState> = new Map();
  private processingEvents: Set<string> = new Set();

  /**
   * Process an incoming webhook event.
   */
  async processEvent(event: SubscriptionEvent): Promise<void> {
    // Idempotency check
    if (this.processingEvents.has(event.eventId)) {
      return;
    }
    this.processingEvents.add(event.eventId);

    switch (event.type) {
      case "created":
        await this.handleCreated(event);
        break;
      case "renewed":
        await this.handleRenewed(event);
        break;
      case "cancelled":
        await this.handleCancelled(event);
        break;
      case "payment_failed":
        await this.handlePaymentFailed(event);
        break;
    }
  }

  private async handleCreated(event: SubscriptionEvent): Promise<void> {
    this.subscriptions.set(event.subscriptionId, {
      id: event.subscriptionId,
      userId: event.userId,
      status: "active",
      currentPeriodEnd: event.timestamp + 30 * 24 * 60 * 60 * 1000,
    });
  }

  private async handleRenewed(event: SubscriptionEvent): Promise<void> {
    const sub = this.subscriptions.get(event.subscriptionId);
    if (sub) {
      sub.status = "active";
      sub.currentPeriodEnd = event.timestamp + 30 * 24 * 60 * 60 * 1000;
    } else {
      this.subscriptions.set(event.subscriptionId, {
        id: event.subscriptionId,
        userId: event.userId,
        status: "active",
        currentPeriodEnd: event.timestamp + 30 * 24 * 60 * 60 * 1000,
      });
    }
  }

  private async handleCancelled(event: SubscriptionEvent): Promise<void> {
    const sub = this.subscriptions.get(event.subscriptionId);
    if (sub) {
      sub.status = "cancelled";
    }
  }

  private async handlePaymentFailed(event: SubscriptionEvent): Promise<void> {
    const sub = this.subscriptions.get(event.subscriptionId);
    if (sub) {
      sub.status = "past_due";
    }
  }

  /**
   * Verify that a user has an active subscription.
   */
  hasActiveSubscription(userId: string): boolean {
    for (const sub of this.subscriptions.values()) {
      if (sub.userId === userId && sub.status === "active") {
        return true;
      }
    }
    return false;
  }
}
