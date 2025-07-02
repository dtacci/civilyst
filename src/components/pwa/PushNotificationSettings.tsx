'use client';

import { useState, useEffect } from 'react';
import {
  pushNotificationService,
  type PushNotificationPermission,
} from '~/lib/push-notifications';

interface PushNotificationSettingsProps {
  className?: string;
}

export function PushNotificationSettings({
  className = '',
}: PushNotificationSettingsProps) {
  const [permission, setPermission] = useState<PushNotificationPermission>({
    granted: false,
    denied: false,
    default: true,
  });
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const isSupported = pushNotificationService.isSupported();
      setSupported(isSupported);

      if (!isSupported) {
        setLoading(false);
        return;
      }

      const currentPermission = pushNotificationService.getPermissionStatus();
      setPermission(currentPermission);

      if (currentPermission.granted) {
        const { subscribed: isCurrentlySubscribed } =
          await pushNotificationService.getSubscriptionStatus();
        setSubscribed(isCurrentlySubscribed);
      }
    } catch (err) {
      console.error('Error checking notification status:', err);
      setError('Failed to check notification status');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const success = await pushNotificationService.requestPermission();
      if (success) {
        await pushNotificationService.subscribe();
        await checkNotificationStatus(); // Refresh status
      } else {
        setError('Permission denied for notifications');
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setError('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      await pushNotificationService.unsubscribe();
      await checkNotificationStatus(); // Refresh status
    } catch (err) {
      console.error('Error disabling notifications:', err);
      setError('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setError(null);
      await pushNotificationService.showLocalNotification({
        title: 'Test Notification 🔔',
        body: 'This is a test notification to verify your settings are working correctly.',
        icon: '/icon-192x192.png',
        data: {
          type: 'campaign_update',
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error('Error showing test notification:', err);
      setError('Failed to show test notification');
    }
  };

  if (!supported) {
    return (
      <div
        className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center">
          <div className="text-yellow-600 mr-3">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Push Notifications Not Supported
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser doesn&apos;t support push notifications or
              you&apos;re using a private browsing mode.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Push Notifications
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Get notified about new campaigns, votes, and comments even when the
            app is closed
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {permission.granted && subscribed && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Active
            </span>
          )}
          {permission.denied && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              ✗ Blocked
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {permission.default && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700 mb-3">
              Enable push notifications to receive updates about campaign
              activities, new votes, and comments even when Civilyst is closed.
            </p>
            <button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          </div>
        )}

        {permission.granted && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Browser Notifications
              </span>
              <button
                onClick={
                  subscribed
                    ? handleDisableNotifications
                    : handleEnableNotifications
                }
                disabled={loading}
                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                  subscribed
                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {loading ? 'Working...' : subscribed ? 'Disable' : 'Enable'}
              </button>
            </div>

            {subscribed && (
              <div className="space-y-2">
                <button
                  onClick={handleTestNotification}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Send Test Notification
                </button>
                <p className="text-xs text-gray-500">
                  Notifications will appear when campaigns are created, updated,
                  or receive new votes and comments.
                </p>
              </div>
            )}
          </div>
        )}

        {permission.denied && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Notifications Blocked
            </h4>
            <p className="text-sm text-red-700 mb-3">
              Push notifications are currently blocked. To enable them:
            </p>
            <ol className="text-sm text-red-700 space-y-1 ml-4 list-decimal">
              <li>Click the lock icon in your browser&apos;s address bar</li>
              <li>Change notification permissions to &quot;Allow&quot;</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
