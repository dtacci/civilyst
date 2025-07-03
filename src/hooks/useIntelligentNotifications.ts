'use client';

import { useCallback } from 'react';
import { intelligentNotificationService } from '~/lib/intelligent-notifications';
import type { 
  NotificationType, 
  IntelligentNotificationPayload 
} from '~/lib/intelligent-notifications';

interface UseIntelligentNotificationsOptions {
  userId?: string;
  autoTrigger?: boolean;
}

export function useIntelligentNotifications(options: UseIntelligentNotificationsOptions = {}) {
  const { userId, autoTrigger = true } = options;

  /**
   * Send a campaign creation notification
   */
  const notifyCampaignCreated = useCallback(async (campaign: {
    id: string;
    title: string;
    description: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
    creatorId: string;
  }) => {
    if (!autoTrigger) return;

    try {
      if (campaign.location) {
        await intelligentNotificationService.sendLocationBasedNotification(
          campaign.id,
          campaign.location,
          'created'
        );
      }

      // Send notification to followers/interested users
      const payload: IntelligentNotificationPayload = {
        title: 'New Campaign Created',
        body: `${campaign.title} - Join the civic conversation`,
        icon: '/icon-192x192.png',
        badge: '/badge-campaign.png',
        data: {
          type: 'campaign_created',
          campaignId: campaign.id,
          location: campaign.location,
          timestamp: Date.now(),
          url: `/campaigns/${campaign.id}`,
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
          type: 'campaign_created',
          priority: 'medium',
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

      await intelligentNotificationService.sendIntelligentNotification(payload);
    } catch (error) {
      console.error('Failed to send campaign creation notification:', error);
    }
  }, [autoTrigger]);

  /**
   * Send a vote milestone notification
   */
  const notifyVoteMilestone = useCallback(async (campaign: {
    id: string;
    title: string;
    voteCount: number;
    milestoneType: 'votes' | 'comments';
  }) => {
    if (!autoTrigger) return;

    try {
      await intelligentNotificationService.sendEngagementMilestone(
        campaign.id,
        {
          type: campaign.milestoneType,
          count: campaign.voteCount,
        }
      );
    } catch (error) {
      console.error('Failed to send vote milestone notification:', error);
    }
  }, [autoTrigger]);

  /**
   * Send a comment reply notification
   */
  const notifyCommentReply = useCallback(async (comment: {
    id: string;
    campaignId: string;
    campaignTitle: string;
    authorId: string;
    replyToUserId: string;
    content: string;
  }) => {
    if (!autoTrigger) return;

    try {
      const payload: IntelligentNotificationPayload = {
        title: 'New Reply to Your Comment',
        body: `Someone replied to your comment on "${comment.campaignTitle}"`,
        icon: '/icon-192x192.png',
        badge: '/badge-comment.png',
        data: {
          type: 'comment_reply',
          campaignId: comment.campaignId,
          userId: comment.replyToUserId,
          timestamp: Date.now(),
          url: `/campaigns/${comment.campaignId}#comment-${comment.id}`,
        },
        actions: [
          {
            action: 'view',
            title: 'View Reply',
            icon: '/icon-view.png',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
        delivery: {
          type: 'comment_reply',
          priority: 'high',
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

      await intelligentNotificationService.sendIntelligentNotification(
        payload,
        [comment.replyToUserId]
      );
    } catch (error) {
      console.error('Failed to send comment reply notification:', error);
    }
  }, [autoTrigger]);

  /**
   * Send an engagement streak notification
   */
  const notifyEngagementStreak = useCallback(async (user: {
    id: string;
    streakDays: number;
    activityType: 'voting' | 'commenting' | 'creating';
  }) => {
    if (!autoTrigger) return;

    try {
      const payload: IntelligentNotificationPayload = {
        title: `🔥 ${user.streakDays} Day Civic Engagement Streak!`,
        body: `You've been actively ${user.activityType} for ${user.streakDays} days straight. Keep up the great civic participation!`,
        icon: '/icon-192x192.png',
        badge: '/badge-streak.png',
        data: {
          type: 'engagement_streak',
          userId: user.id,
          engagement: {
            votes: 0,
            comments: 0,
            shares: 0,
          },
          timestamp: Date.now(),
          url: '/dashboard',
        },
        actions: [
          {
            action: 'view',
            title: 'View Dashboard',
            icon: '/icon-dashboard.png',
          },
          {
            action: 'share',
            title: 'Share Achievement',
            icon: '/icon-share.png',
          },
        ],
        delivery: {
          type: 'engagement_streak',
          priority: 'low',
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

      await intelligentNotificationService.sendIntelligentNotification(
        payload,
        [user.id]
      );
    } catch (error) {
      console.error('Failed to send engagement streak notification:', error);
    }
  }, [autoTrigger]);

  /**
   * Send an emergency civic alert
   */
  const notifyEmergencyAlert = useCallback(async (alert: {
    title: string;
    message: string;
    location?: {
      lat: number;
      lng: number;
      radius: number;
    };
    urgency: 'high' | 'critical';
    actionUrl?: string;
  }) => {
    try {
      const payload: IntelligentNotificationPayload = {
        title: `🚨 ${alert.title}`,
        body: alert.message,
        icon: '/icon-emergency.png',
        badge: '/badge-emergency.png',
        data: {
          type: 'emergency_alert',
          timestamp: Date.now(),
          url: alert.actionUrl || '/dashboard',
        },
        actions: [
          {
            action: 'view',
            title: 'View Details',
            icon: '/icon-alert.png',
          },
        ],
        delivery: {
          type: 'emergency_alert',
          priority: 'urgent',
          locationBased: alert.location ? {
            latitude: alert.location.lat,
            longitude: alert.location.lng,
            radius: alert.location.radius,
          } : undefined,
          timing: {
            immediate: true,
          },
          personalization: {
            respectQuietHours: false, // Emergency alerts override quiet hours
            checkEngagement: false,
            locationFilter: !!alert.location,
          },
        },
      };

      await intelligentNotificationService.sendIntelligentNotification(payload);
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
    }
  }, []);

  /**
   * Test notification for development
   */
  const sendTestNotification = useCallback(async (type: NotificationType = 'campaign_created') => {
    try {
      const testPayloads: Record<NotificationType, Partial<IntelligentNotificationPayload>> = {
        campaign_created: {
          title: 'Test: New Campaign Created',
          body: 'This is a test notification for campaign creation',
        },
        campaign_updated: {
          title: 'Test: Campaign Updated',
          body: 'This is a test notification for campaign updates',
        },
        campaign_nearby: {
          title: 'Test: Campaign Near You',
          body: 'This is a test notification for nearby campaigns',
        },
        vote_milestone: {
          title: 'Test: Vote Milestone',
          body: 'This is a test notification for vote milestones',
        },
        comment_reply: {
          title: 'Test: Comment Reply',
          body: 'This is a test notification for comment replies',
        },
        comment_trending: {
          title: 'Test: Trending Comment',
          body: 'This is a test notification for trending comments',
        },
        engagement_streak: {
          title: 'Test: Engagement Streak',
          body: 'This is a test notification for engagement streaks',
        },
        civic_reminder: {
          title: 'Test: Civic Reminder',
          body: 'This is a test notification for civic reminders',
        },
        emergency_alert: {
          title: 'Test: Emergency Alert',
          body: 'This is a test notification for emergency alerts',
        },
      };

      const basePayload: IntelligentNotificationPayload = {
        title: 'Test Notification',
        body: 'This is a test notification',
        icon: '/icon-192x192.png',
        data: {
          type,
          timestamp: Date.now(),
          url: '/dashboard',
        },
        delivery: {
          type,
          priority: 'medium',
          timing: {
            immediate: true,
          },
          personalization: {
            respectQuietHours: false,
            checkEngagement: false,
            locationFilter: false,
          },
        },
      };

      const payload = { ...basePayload, ...testPayloads[type] };

      if (userId) {
        await intelligentNotificationService.sendIntelligentNotification(payload, [userId]);
      } else {
        await intelligentNotificationService.sendIntelligentNotification(payload);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }, [userId]);

  return {
    notifyCampaignCreated,
    notifyVoteMilestone,
    notifyCommentReply,
    notifyEngagementStreak,
    notifyEmergencyAlert,
    sendTestNotification,
  };
}