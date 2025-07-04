import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '~/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: authUserId } = await auth();
    const resolvedParams = await params;

    // Only allow users to access their own stats
    if (!authUserId || authUserId !== resolvedParams.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's activity data to calculate engagement patterns
    const user = await db.user.findUnique({
      where: { id: resolvedParams.userId },
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
        pushSubscriptions: {
          where: { isActive: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate engagement statistics
    const stats = calculateNotificationStats(user);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateNotificationStats(user: Record<string, unknown>) {
  // Calculate hourly activity pattern
  const hourlyActivity = new Array(24).fill(0);

  // Analyze votes
  (user.votes as Array<{ createdAt: string }>).forEach((vote) => {
    const hour = new Date(vote.createdAt).getHours();
    hourlyActivity[hour]++;
  });

  // Analyze comments
  (user.comments as Array<{ createdAt: string }>).forEach((comment) => {
    const hour = new Date(comment.createdAt).getHours();
    hourlyActivity[hour]++;
  });

  // Find optimal notification times (top 3 most active hours)
  const optimalTimes = hourlyActivity
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((item) => item.hour)
    .sort();

  // Calculate engagement score based on activity
  const totalActivity =
    (user.votes as Array<unknown>).length +
    (user.comments as Array<unknown>).length +
    (user.campaigns as Array<unknown>).length;
  const engagementScore = Math.min(100, Math.round(totalActivity * 2.5));

  // Mock notification delivery stats (in a real app, these would come from notification logs)
  const mockStats = {
    totalSent: Math.max(5, totalActivity * 3),
    deliveryRate: Math.random() * 15 + 85, // 85-100%
    openRate: Math.random() * 20 + 60, // 60-80%
  };

  return {
    totalSent: mockStats.totalSent,
    deliveryRate: Math.round(mockStats.deliveryRate),
    openRate: Math.round(mockStats.openRate),
    engagementScore,
    optimalTimes,
    locationEngagement: {
      nearbyRadius: 10,
      averageDistance: 5.2,
    },
  };
}
