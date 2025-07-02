/**
 * Push Notification Service
 *
 * Handles browser push notifications for campaign activities when the app is closed.
 * Integrates with existing real-time notification system.
 */

interface PushNotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    campaignId?: string;
    type: 'vote' | 'comment' | 'campaign_update' | 'new_campaign';
    timestamp: number;
    url?: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

// Extended notification options to include actions (not in all TypeScript definitions)
interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported in this browser');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      console.log('Push notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      return false;
    }
  }

  /**
   * Check current notification permission status
   */
  getPermissionStatus(): PushNotificationPermission {
    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default',
    };
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) {
        await this.initialize();
      }

      if (!this.registration) {
        throw new Error('Service worker not registered');
      }

      // Check if already subscribed
      let subscription = await this.registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
        });
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.registration) {
        return true;
      }

      const subscription =
        await this.registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
      }

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Show a local notification (for testing)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (!this.registration) {
        await this.initialize();
      }

      if (!this.registration) {
        throw new Error('Service worker not registered');
      }

      const options: ExtendedNotificationOptions = {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/icon-192x192.png',
        tag: payload.tag || 'civilyst-notification',
        data: payload.data,
        requireInteraction: true,
        silent: false,
      };

      // Add actions if supported
      if (payload.actions) {
        options.actions = payload.actions;
      } else {
        options.actions = [
          {
            action: 'view',
            title: 'View Campaign',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ];
      }

      await this.registration.showNotification(payload.title, options);
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send subscription to server: ${response.status}`
        );
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to remove subscription from server: ${response.status}`
        );
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if push notifications are supported and enabled
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(): Promise<{
    subscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    try {
      if (!this.registration) {
        await this.initialize();
      }

      if (!this.registration) {
        return { subscribed: false, subscription: null };
      }

      const subscription =
        await this.registration.pushManager.getSubscription();
      return {
        subscribed: !!subscription,
        subscription,
      };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { subscribed: false, subscription: null };
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export types
export type { PushNotificationPermission, NotificationPayload };
