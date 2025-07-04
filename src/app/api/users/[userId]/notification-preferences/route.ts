import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/lib/db';

interface NotificationPreferencesData {
  preferences: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: string;
  }>;
  locationSettings: {
    enabled: boolean;
    radius: number;
    coordinates?: {
      lat: number;
      lng: number;
      address: string;
    };
  };
  timingSettings: {
    quietHours: {
      enabled: boolean;
      start: number;
      end: number;
    };
    optimalTiming: boolean;
    instantDelivery: boolean;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: authUserId } = await auth();

    const resolvedParams = await params;

    // Only allow users to access their own preferences
    if (!authUserId || authUserId !== resolvedParams.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notification preferences from database
    const user = await db.user.findUnique({
      where: { id: resolvedParams.userId },
      select: {
        id: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse stored preferences or return defaults
    let preferences: NotificationPreferencesData;

    if (user.notificationPreferences) {
      try {
        preferences = JSON.parse(user.notificationPreferences as string);
      } catch {
        preferences = getDefaultPreferences();
      }
    } else {
      preferences = getDefaultPreferences();
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: authUserId } = await auth();
    const resolvedParams = await params;

    // Only allow users to update their own preferences
    if (!authUserId || authUserId !== resolvedParams.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const preferencesData: NotificationPreferencesData = body;

    // Validate the data structure
    if (
      !preferencesData.preferences ||
      !preferencesData.locationSettings ||
      !preferencesData.timingSettings
    ) {
      return NextResponse.json(
        { error: 'Invalid preferences data structure' },
        { status: 400 }
      );
    }

    // Update user's notification preferences in database
    await db.user.update({
      where: { id: resolvedParams.userId },
      data: {
        notificationPreferences: JSON.stringify(preferencesData),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getDefaultPreferences(): NotificationPreferencesData {
  return {
    preferences: [
      {
        id: 'campaign_created',
        name: 'New Campaigns',
        description: 'Get notified when new campaigns are created in your area',
        enabled: true,
        category: 'content',
      },
      {
        id: 'campaign_nearby',
        name: 'Nearby Activity',
        description:
          'Alerts for campaign activity within your specified radius',
        enabled: true,
        category: 'location',
      },
      {
        id: 'vote_milestone',
        name: 'Vote Milestones',
        description: 'When campaigns you follow reach voting milestones',
        enabled: true,
        category: 'engagement',
      },
      {
        id: 'comment_reply',
        name: 'Comment Replies',
        description: 'When someone replies to your comments',
        enabled: true,
        category: 'engagement',
      },
      {
        id: 'engagement_streak',
        name: 'Engagement Streaks',
        description: 'Celebrate your civic participation streaks',
        enabled: false,
        category: 'engagement',
      },
      {
        id: 'emergency_alert',
        name: 'Emergency Alerts',
        description: 'Critical civic announcements and emergency information',
        enabled: true,
        category: 'content',
      },
    ],
    locationSettings: {
      enabled: true,
      radius: 10,
    },
    timingSettings: {
      quietHours: {
        enabled: true,
        start: 22,
        end: 8,
      },
      optimalTiming: true,
      instantDelivery: false,
    },
  };
}
