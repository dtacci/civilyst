'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, MessageCircle, ThumbsUp, AlertCircle } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useActiveCampaignsRealtime } from '~/hooks/useRealtimeSubscriptions';
import { Button } from '~/components/ui/button';

interface Notification {
  id: string;
  type: 'campaign_update' | 'new_comment' | 'new_vote' | 'connection_lost';
  title: string;
  message: string;
  timestamp: Date;
  campaignId?: string;
  campaignTitle?: string;
  read: boolean;
}

interface RealtimeNotificationsProps {
  variant?: 'badge' | 'full' | 'dropdown';
  maxNotifications?: number;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
}

export function RealtimeNotifications({
  variant = 'badge',
  maxNotifications = 10,
  autoHide = true,
  autoHideDelay = 5000,
  className,
  onNotificationClick,
}: RealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const { campaignUpdate, isConnected } = useActiveCampaignsRealtime();

  const addNotification = useCallback(
    (notification: Notification) => {
      setNotifications((prev) => {
        const newNotifications = [notification, ...prev];

        // Auto-hide if enabled
        if (autoHide && autoHideDelay > 0) {
          setTimeout(() => {
            markAsRead(notification.id);
          }, autoHideDelay);
        }

        // Limit notifications
        return newNotifications.slice(0, maxNotifications);
      });
    },
    [autoHide, autoHideDelay, maxNotifications]
  );

  // Handle campaign updates
  useEffect(() => {
    if (!campaignUpdate) return;

    const notification: Notification = {
      id: `campaign_${campaignUpdate.new?.id}_${Date.now()}`,
      type: 'campaign_update',
      title: 'Campaign Updated',
      message:
        campaignUpdate.eventType === 'INSERT'
          ? `New campaign: ${campaignUpdate.new?.title}`
          : campaignUpdate.eventType === 'UPDATE'
            ? `Campaign updated: ${campaignUpdate.new?.title}`
            : `Campaign removed: ${campaignUpdate.old?.title}`,
      timestamp: new Date(),
      campaignId: campaignUpdate.new?.id || campaignUpdate.old?.id,
      campaignTitle: campaignUpdate.new?.title || campaignUpdate.old?.title,
      read: false,
    };

    addNotification(notification);
  }, [campaignUpdate, addNotification]);

  // Handle connection status
  useEffect(() => {
    if (!isConnected) {
      const notification: Notification = {
        id: `connection_lost_${Date.now()}`,
        type: 'connection_lost',
        title: 'Connection Lost',
        message: 'Real-time updates are temporarily unavailable',
        timestamp: new Date(),
        read: false,
      };
      addNotification(notification);
    }
  }, [isConnected, addNotification]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = notifications.filter(
    (n) => !n.read || !autoHide
  );

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'campaign_update':
        return <Bell className="h-4 w-4" />;
      case 'new_comment':
        return <MessageCircle className="h-4 w-4" />;
      case 'new_vote':
        return <ThumbsUp className="h-4 w-4" />;
      case 'connection_lost':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'campaign_update':
        return 'text-blue-600 bg-blue-50';
      case 'new_comment':
        return 'text-green-600 bg-green-50';
      case 'new_vote':
        return 'text-purple-600 bg-purple-50';
      case 'connection_lost':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onNotificationClick?.(notification);
  };

  // Badge variant - just show count
  if (variant === 'badge') {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Simple dropdown */}
        {isExpanded && visibleNotifications.length > 0 && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                    !notification.read && 'bg-blue-50'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={cn(
                        'p-1 rounded-full',
                        getNotificationColor(notification.type)
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full variant - show notification list
  if (variant === 'full') {
    return (
      <div
        className={cn(
          'bg-white rounded-lg border border-gray-200 shadow-sm',
          className
        )}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Live Updates</h3>
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>No recent updates</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {visibleNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                  !notification.read && 'bg-blue-50'
                )}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={cn(
                      'p-2 rounded-full',
                      getNotificationColor(notification.type)
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {notification.timestamp.toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {visibleNotifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 flex justify-between">
            <Button size="sm" variant="ghost" onClick={markAllAsRead}>
              Mark all read
            </Button>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear all
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
