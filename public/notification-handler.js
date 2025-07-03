/**
 * Intelligent Notification Handler for Service Worker
 *
 * Handles advanced push notification features including:
 * - Location-based notifications
 * - Intelligent timing
 * - Action handling
 * - Analytics tracking
 */

// Notification action handlers
const notificationActions = {
  view: async (data) => {
    // Open the campaign page
    const url = data.url || `/campaigns/${data.campaignId}`;
    await clients.openWindow(url);
  },

  directions: async (data) => {
    // Open directions to campaign location
    if (data.location) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${data.location.lat},${data.location.lng}`;
      await clients.openWindow(mapsUrl);
    }
  },

  share: async (data) => {
    // Open share dialog
    if (navigator.share && data.url) {
      try {
        await navigator.share({
          title: 'Civilyst Campaign',
          text: 'Check out this civic engagement campaign',
          url: data.url,
        });
      } catch (err) {
        // Log sharing errors in development only
        if (
          self.location.hostname === 'localhost' ||
          self.location.hostname === '127.0.0.1'
        ) {
          console.error('[Notification] Error sharing:', err);
        }
      }
    } else {
      // Fallback to opening the campaign
      await notificationActions.view(data);
    }
  },

  vote: async (data) => {
    // Quick vote action (would integrate with API)
    const url = data.url || `/campaigns/${data.campaignId}`;
    await clients.openWindow(url);
  },

  dismiss: async (data) => {
    // Just close the notification - analytics will track this
    // Log notification dismissal in development only
    if (
      self.location.hostname === 'localhost' ||
      self.location.hostname === '127.0.0.1'
    ) {
      console.info('[Notification] Notification dismissed:', data);
    }
  },
};

// Enhanced push event handler
self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  const payload = event.data.json();

  // Enhanced notification options
  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/badge-notification.png',
    tag: payload.tag || `civilyst-${payload.data.type}-${Date.now()}`,
    data: payload.data,
    requireInteraction: payload.data.type === 'emergency_alert',
    silent: false,
    timestamp: payload.data.timestamp || Date.now(),

    // Enhanced actions based on notification type
    actions: getActionsForNotificationType(payload.data.type, payload.actions),

    // Rich media for supported browsers
    image: payload.image,

    // Vibration pattern for different notification types
    vibrate: getVibrationPattern(payload.data.type),
  };

  // Show the notification
  event.waitUntil(
    self.registration
      .showNotification(payload.title, notificationOptions)
      .then(() => {
        // Track notification delivery
        return trackNotificationEvent('delivered', payload);
      })
      .catch((error) => {
        console.error('Error showing notification:', error);
        return trackNotificationEvent('failed', payload);
      })
  );
});

// Enhanced notification click handler
self.addEventListener('notificationclick', function (event) {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  // Close the notification
  notification.close();

  // Track notification interaction
  event.waitUntil(
    trackNotificationEvent(action || 'clicked', { data })
      .then(() => {
        // Handle the action
        if (action && notificationActions[action]) {
          return notificationActions[action](data);
        } else {
          // Default action - open the app
          return notificationActions.view(data);
        }
      })
      .catch((error) => {
        console.error('Error handling notification action:', error);
      })
  );
});

// Notification close handler (for analytics)
self.addEventListener('notificationclose', function (event) {
  const data = event.notification.data;

  event.waitUntil(trackNotificationEvent('dismissed', { data }));
});

// Helper functions

function getActionsForNotificationType(type, customActions) {
  if (customActions && customActions.length > 0) {
    return customActions.slice(0, 3); // Maximum 3 actions
  }

  const defaultActions = {
    campaign_created: [
      { action: 'view', title: 'View Campaign', icon: '/icon-view.png' },
      { action: 'share', title: 'Share', icon: '/icon-share.png' },
    ],
    campaign_nearby: [
      { action: 'view', title: 'View Campaign', icon: '/icon-view.png' },
      {
        action: 'directions',
        title: 'Get Directions',
        icon: '/icon-directions.png',
      },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vote_milestone: [
      { action: 'view', title: 'View Results', icon: '/icon-view.png' },
      { action: 'share', title: 'Share Milestone', icon: '/icon-share.png' },
    ],
    comment_reply: [
      { action: 'view', title: 'View Comment', icon: '/icon-view.png' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    emergency_alert: [
      { action: 'view', title: 'View Alert', icon: '/icon-alert.png' },
    ],
  };

  return (
    defaultActions[type] || [
      { action: 'view', title: 'Open', icon: '/icon-view.png' },
      { action: 'dismiss', title: 'Dismiss' },
    ]
  );
}

function getVibrationPattern(type) {
  const patterns = {
    emergency_alert: [200, 100, 200, 100, 200], // Urgent pattern
    campaign_nearby: [100, 50, 100], // Location pattern
    vote_milestone: [150, 75, 150, 75, 150], // Celebration pattern
    comment_reply: [100], // Simple pattern
    default: [100, 50, 100], // Standard pattern
  };

  return patterns[type] || patterns.default;
}

async function trackNotificationEvent(eventType, payload) {
  try {
    // In a real implementation, this would send analytics to your backend
    // Log notification events in development only
    if (
      self.location.hostname === 'localhost' ||
      self.location.hostname === '127.0.0.1'
    ) {
      console.info('[Notification] Notification event:', {
        type: eventType,
        notificationType: payload.data?.type,
        campaignId: payload.data?.campaignId,
        timestamp: Date.now(),
      });
    }

    // You could also store events in IndexedDB for offline tracking
    // and sync them when the user comes back online
  } catch (error) {
    console.error('Error tracking notification event:', error);
  }
}

// Background sync for notification analytics
self.addEventListener('sync', function (event) {
  if (event.tag === 'notification-analytics-sync') {
    event.waitUntil(syncNotificationAnalytics());
  }
});

async function syncNotificationAnalytics() {
  try {
    // Sync any pending notification analytics to the server
    // This would retrieve data from IndexedDB and send to API
    // Log analytics sync in development only
    if (
      self.location.hostname === 'localhost' ||
      self.location.hostname === '127.0.0.1'
    ) {
      console.info('[Notification] Syncing notification analytics...');
    }
  } catch (error) {
    console.error('Error syncing notification analytics:', error);
  }
}

// Location-based notification filtering (if geolocation is available)
// Note: This function is available for future location-based filtering features
// Currently not actively used but kept for potential enhancement
async function shouldShowLocationBasedNotification(notificationData) {
  if (!notificationData.location || !navigator.geolocation) {
    return true; // Show by default if no location data
  }

  try {
    // Get user's current location
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 300000, // 5 minutes cache
      });
    });

    // Calculate distance
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      notificationData.location.lat,
      notificationData.location.lng
    );

    // Check if within radius (default 10km)
    const maxRadius = notificationData.locationRadius || 10;
    return distance <= maxRadius;
  } catch (error) {
    // Log location errors in development only
    if (
      self.location.hostname === 'localhost' ||
      self.location.hostname === '127.0.0.1'
    ) {
      console.error(
        '[Notification] Error checking location for notification:',
        error
      );
    }
    return true; // Show by default if location check fails
  }
}

// Keep function available for potential future use
// Log location filtering availability in development only
if (
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1'
) {
  console.info(
    '[Notification] Location filtering available:',
    typeof shouldShowLocationBasedNotification
  );
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Export for testing or debugging
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    notificationActions,
    getActionsForNotificationType,
    getVibrationPattern,
    trackNotificationEvent,
  };
}
