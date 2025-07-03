/**
 * Intelligent Push Notification System
 * 
 * Advanced notification system with ML-powered timing, location-based alerts,
 * and personalized delivery preferences for civic engagement.
 */

import { db } from '~/lib/db';

// Notification types with intelligent delivery rules
export type NotificationType = 
  | 'campaign_created'
  | 'campaign_updated'
  | 'campaign_nearby'
  | 'vote_milestone'
  | 'comment_reply'
  | 'comment_trending'
  | 'engagement_streak'
  | 'civic_reminder'
  | 'emergency_alert';

// User engagement patterns for ML timing
export interface UserEngagementPattern {
  userId: string;
  hourlyActivity: number[]; // 24-hour activity pattern (0-23)
  weeklyActivity: number[]; // 7-day activity pattern (0-6)
  notificationResponse: {
    opened: number;
    dismissed: number;
    ignored: number;
  };
  locationPreferences: {
    radius: number; // km
    categories: string[];
  };
  quietHours: {
    start: number; // hour 0-23
    end: number; // hour 0-23
  };
}

// Notification delivery optimization
export interface NotificationDeliveryOptions {
  type: NotificationType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  locationBased?: {
    latitude: number;
    longitude: number;
    radius: number; // km
  };
  timing: {
    immediate?: boolean;
    optimal?: boolean;
    scheduled?: Date;
  };
  personalization: {
    respectQuietHours: boolean;
    checkEngagement: boolean;
    locationFilter: boolean;
  };
}

// Enhanced notification payload
export interface IntelligentNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data: {
    type: NotificationType;
    campaignId?: string;
    userId?: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
    engagement?: {
      votes: number;
      comments: number;
      shares: number;
    };
    timestamp: number;
    url?: string;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  delivery: NotificationDeliveryOptions;
}

class IntelligentNotificationService {
  private static instance: IntelligentNotificationService;
  private engagementPatterns: Map<string, UserEngagementPattern> = new Map();

  public static getInstance(): IntelligentNotificationService {
    if (!IntelligentNotificationService.instance) {
      IntelligentNotificationService.instance = new IntelligentNotificationService();
    }
    return IntelligentNotificationService.instance;
  }

  /**
   * Send intelligent notification with ML-powered timing and location filtering
   */
  async sendIntelligentNotification(
    payload: IntelligentNotificationPayload,
    targetUserIds?: string[]
  ): Promise<void> {
    try {
      const users = targetUserIds || await this.getRelevantUsers(payload);
      
      for (const userId of users) {
        const shouldDeliver = await this.shouldDeliverNotification(userId, payload);
        
        if (shouldDeliver) {
          const optimizedPayload = await this.optimizeNotificationForUser(userId, payload);
          await this.deliverNotification(userId, optimizedPayload);
        }
      }
    } catch (error) {
      console.error('Failed to send intelligent notification:', error);
    }
  }

  /**
   * Analyze user engagement patterns for ML timing
   */
  async analyzeUserEngagement(userId: string): Promise<UserEngagementPattern> {
    try {
      // Check cache first
      if (this.engagementPatterns.has(userId)) {
        return this.engagementPatterns.get(userId)!;
      }

      // Get user activity data from database
      const userActivity = await db.user.findUnique({
        where: { id: userId },
        include: {
          votes: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
          campaigns: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!userActivity) {
        throw new Error('User not found');
      }

      // Calculate engagement patterns
      const pattern = this.calculateEngagementPattern(userActivity);
      this.engagementPatterns.set(userId, pattern);

      return pattern;
    } catch (error) {
      console.error('Failed to analyze user engagement:', error);
      return this.getDefaultEngagementPattern(userId);
    }
  }

  /**
   * Calculate optimal notification timing based on user patterns
   */
  async calculateOptimalTiming(
    userId: string,
    notificationType: NotificationType
  ): Promise<Date> {
    try {
      const pattern = await this.analyzeUserEngagement(userId);
      const now = new Date();
      const currentHour = now.getHours();

      // Check quiet hours
      if (this.isQuietHour(currentHour, pattern.quietHours)) {
        return this.getNextActiveHour(pattern.quietHours);
      }

      // For urgent notifications, send immediately
      if (notificationType === 'emergency_alert') {
        return now;
      }

      // Calculate optimal hour based on user activity
      const optimalHour = this.findOptimalHour(pattern.hourlyActivity, currentHour);
      
      // If optimal hour is now or within 2 hours, send now
      if (Math.abs(optimalHour - currentHour) <= 2) {
        return now;
      }

      // Schedule for optimal time
      const scheduledTime = new Date(now);
      scheduledTime.setHours(optimalHour, 0, 0, 0);
      
      // If optimal time is in the past, schedule for tomorrow
      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      return scheduledTime;
    } catch (error) {
      console.error('Failed to calculate optimal timing:', error);
      return new Date(); // Fallback to immediate
    }
  }

  /**
   * Check if user should receive location-based notifications
   */
  async shouldReceiveLocationNotification(
    userId: string,
    campaignLocation: { lat: number; lng: number },
    radius: number
  ): Promise<boolean> {
    try {
      // Get user's location preferences
      const userPreferences = await this.getUserLocationPreferences(userId);
      
      if (!userPreferences.enabled) {
        return false;
      }

      // Check if user is within the notification radius
      const userLocation = await this.getUserLocation(userId);
      if (!userLocation) {
        return false;
      }

      const distance = this.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        campaignLocation.lat,
        campaignLocation.lng
      );

      return distance <= Math.min(radius, userPreferences.maxRadius);
    } catch (error) {
      console.error('Failed to check location notification eligibility:', error);
      return false;
    }
  }

  /**
   * Get users who should receive location-based notifications
   */
  async getLocationBasedUsers(
    campaignLocation: { lat: number; lng: number },
    radius: number = 5
  ): Promise<string[]> {
    try {
      // Get users within geographic radius who have location notifications enabled
      const users = await db.user.findMany({
        where: {
          pushSubscriptions: {
            some: {
              isActive: true,
            },
          },
        },
        include: {
          pushSubscriptions: true,
        },
      });

      const eligibleUsers: string[] = [];

      for (const user of users) {
        const shouldReceive = await this.shouldReceiveLocationNotification(
          user.id,
          campaignLocation,
          radius
        );
        
        if (shouldReceive) {
          eligibleUsers.push(user.id);
        }
      }

      return eligibleUsers;
    } catch (error) {
      console.error('Failed to get location-based users:', error);
      return [];
    }
  }

  /**
   * Send location-based campaign notification
   */
  async sendLocationBasedNotification(
    campaignId: string,
    location: { lat: number; lng: number; address: string },
    type: 'created' | 'updated' | 'milestone' = 'created'
  ): Promise<void> {
    try {
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
        include: {
          votes: true,
          comments: true,
          creator: true,
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const eligibleUsers = await this.getLocationBasedUsers(location, 5);

      if (eligibleUsers.length === 0) {
        return;
      }

      const notificationPayload: IntelligentNotificationPayload = {
        title: `${type === 'created' ? 'New' : 'Updated'} Campaign Near You`,
        body: `${campaign.title} - ${location.address}`,
        icon: '/icon-192x192.png',
        badge: '/badge-location.png',
        data: {
          type: type === 'created' ? 'campaign_nearby' : 'campaign_updated',
          campaignId,
          location: {
            lat: location.lat,
            lng: location.lng,
            address: location.address,
          },
          engagement: {
            votes: campaign.votes.length,
            comments: campaign.comments.length,
            shares: 0,
          },
          timestamp: Date.now(),
          url: `/campaigns/${campaignId}`,
        },
        actions: [
          {
            action: 'view',
            title: 'View Campaign',
            icon: '/icon-view.png',
          },
          {
            action: 'directions',
            title: 'Get Directions',
            icon: '/icon-directions.png',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
        delivery: {
          type: type === 'created' ? 'campaign_nearby' : 'campaign_updated',
          priority: 'medium',
          locationBased: {
            latitude: location.lat,
            longitude: location.lng,
            radius: 5,
          },
          timing: {
            optimal: true,
          },
          personalization: {
            respectQuietHours: true,
            checkEngagement: true,
            locationFilter: true,
          },
        },
      };

      await this.sendIntelligentNotification(notificationPayload, eligibleUsers);
    } catch (error) {
      console.error('Failed to send location-based notification:', error);
    }
  }

  /**
   * Send engagement milestone notification
   */
  async sendEngagementMilestone(
    campaignId: string,
    milestone: { type: 'votes' | 'comments'; count: number }
  ): Promise<void> {
    try {
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
        include: {
          creator: true,
          votes: {
            include: { user: true },
          },
          comments: {
            include: { author: true },
          },
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get engaged users (voters and commenters)
      const engagedUsers = new Set<string>();
      campaign.votes.forEach(vote => engagedUsers.add(vote.userId));
      campaign.comments.forEach(comment => engagedUsers.add(comment.authorId));
      engagedUsers.add(campaign.creatorId);

      const targetUsers = Array.from(engagedUsers);

      const notificationPayload: IntelligentNotificationPayload = {
        title: `🎉 Campaign Milestone Reached!`,
        body: `"${campaign.title}" has reached ${milestone.count} ${milestone.type}`,
        icon: '/icon-192x192.png',
        badge: '/badge-milestone.png',
        data: {
          type: 'vote_milestone',
          campaignId,
          engagement: {
            votes: campaign.votes.length,
            comments: campaign.comments.length,
            shares: 0,
          },
          timestamp: Date.now(),
          url: `/campaigns/${campaignId}`,
        },
        actions: [
          {
            action: 'view',
            title: 'View Campaign',
            icon: '/icon-view.png',
          },
          {
            action: 'share',
            title: 'Share',
            icon: '/icon-share.png',
          },
        ],
        delivery: {
          type: 'vote_milestone',
          priority: 'medium',
          timing: {
            optimal: true,
          },
          personalization: {
            respectQuietHours: true,
            checkEngagement: true,
            locationFilter: false,
          },
        },
      };

      await this.sendIntelligentNotification(notificationPayload, targetUsers);
    } catch (error) {
      console.error('Failed to send engagement milestone notification:', error);
    }
  }

  // Private helper methods

  private calculateEngagementPattern(userActivity: Record<string, unknown>): UserEngagementPattern {
    const hourlyActivity = new Array(24).fill(0);
    const weeklyActivity = new Array(7).fill(0);

    // Analyze vote patterns
    (userActivity.votes as Array<{ createdAt: string }>).forEach((vote) => {
      const date = new Date(vote.createdAt);
      hourlyActivity[date.getHours()]++;
      weeklyActivity[date.getDay()]++;
    });

    // Analyze comment patterns
    (userActivity.comments as Array<{ createdAt: string }>).forEach((comment) => {
      const date = new Date(comment.createdAt);
      hourlyActivity[date.getHours()]++;
      weeklyActivity[date.getDay()]++;
    });

    return {
      userId: userActivity.id as string,
      hourlyActivity,
      weeklyActivity,
      notificationResponse: {
        opened: 0,
        dismissed: 0,
        ignored: 0,
      },
      locationPreferences: {
        radius: 10,
        categories: ['local', 'environment', 'transportation'],
      },
      quietHours: {
        start: 22,
        end: 8,
      },
    };
  }

  private getDefaultEngagementPattern(userId: string): UserEngagementPattern {
    return {
      userId,
      hourlyActivity: new Array(24).fill(1),
      weeklyActivity: new Array(7).fill(1),
      notificationResponse: {
        opened: 0,
        dismissed: 0,
        ignored: 0,
      },
      locationPreferences: {
        radius: 10,
        categories: [],
      },
      quietHours: {
        start: 22,
        end: 8,
      },
    };
  }

  private isQuietHour(hour: number, quietHours: { start: number; end: number }): boolean {
    if (quietHours.start < quietHours.end) {
      return hour >= quietHours.start && hour < quietHours.end;
    } else {
      return hour >= quietHours.start || hour < quietHours.end;
    }
  }

  private getNextActiveHour(quietHours: { start: number; end: number }): Date {
    const now = new Date();
    const nextActive = new Date(now);
    nextActive.setHours(quietHours.end, 0, 0, 0);
    
    if (nextActive <= now) {
      nextActive.setDate(nextActive.getDate() + 1);
    }
    
    return nextActive;
  }

  private findOptimalHour(hourlyActivity: number[], currentHour: number): number {
    let maxActivity = 0;
    let optimalHour = currentHour;

    for (let i = 0; i < hourlyActivity.length; i++) {
      if (hourlyActivity[i] > maxActivity) {
        maxActivity = hourlyActivity[i];
        optimalHour = i;
      }
    }

    return optimalHour;
  }

  private async getUserLocationPreferences(_userId: string): Promise<{
    enabled: boolean;
    maxRadius: number;
  }> {
    // This would typically come from user preferences in the database
    return {
      enabled: true,
      maxRadius: 10,
    };
  }

  private async getUserLocation(_userId: string): Promise<{ lat: number; lng: number } | null> {
    // This would typically come from user's last known location or preferences
    // For now, return null to indicate no location data
    return null;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private async shouldDeliverNotification(
    userId: string,
    payload: IntelligentNotificationPayload
  ): Promise<boolean> {
    // Check if user has active push subscription
    const hasSubscription = await db.pushSubscription.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (!hasSubscription) {
      return false;
    }

    // Check timing preferences
    if (payload.delivery.personalization.respectQuietHours) {
      const pattern = await this.analyzeUserEngagement(userId);
      const currentHour = new Date().getHours();
      if (this.isQuietHour(currentHour, pattern.quietHours)) {
        return false;
      }
    }

    // Check location preferences
    if (payload.delivery.locationBased && payload.delivery.personalization.locationFilter) {
      const shouldReceive = await this.shouldReceiveLocationNotification(
        userId,
        {
          lat: payload.delivery.locationBased.latitude,
          lng: payload.delivery.locationBased.longitude,
        },
        payload.delivery.locationBased.radius
      );
      if (!shouldReceive) {
        return false;
      }
    }

    return true;
  }

  private async optimizeNotificationForUser(
    userId: string,
    payload: IntelligentNotificationPayload
  ): Promise<IntelligentNotificationPayload> {
    // Personalize notification content based on user preferences
    const pattern = await this.analyzeUserEngagement(userId);
    
    // For now, return the payload as-is
    // In a real implementation, this would customize the content
    return payload;
  }

  private async deliverNotification(
    userId: string,
    payload: IntelligentNotificationPayload
  ): Promise<void> {
    // Get user's push subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Send to each subscription
    for (const subscription of subscriptions) {
      try {
        await this.sendPushNotification(subscription, payload);
      } catch (error) {
        console.error(`Failed to send push notification to ${subscription.endpoint}:`, error);
      }
    }
  }

  private async sendPushNotification(
    subscription: Record<string, unknown>,
    _payload: IntelligentNotificationPayload
  ): Promise<void> {
    // This would integrate with a push notification service like Firebase, OneSignal, etc.
    // For now, we'll use the existing local notification system
    console.log(`Sending push notification to ${subscription.endpoint}:`);
  }

  private async getRelevantUsers(payload: IntelligentNotificationPayload): Promise<string[]> {
    // Get users who should receive this notification based on type
    const users = await db.user.findMany({
      where: {
        pushSubscriptions: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
      },
    });

    return users.map(user => user.id);
  }
}

// Export singleton instance
export const intelligentNotificationService = IntelligentNotificationService.getInstance();

// Types are already exported above with their definitions