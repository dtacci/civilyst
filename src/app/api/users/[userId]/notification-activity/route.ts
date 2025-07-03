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
    
    // Only allow users to access their own activity
    if (!authUserId || authUserId !== resolvedParams.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's recent activity to simulate notification activity
    const user = await db.user.findUnique({
      where: { id: resolvedParams.userId },
      include: {
        votes: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        comments: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        campaigns: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate mock notification activity based on user's real activity
    const activities: Array<{
      id: string;
      type: 'sent' | 'delivered' | 'opened' | 'dismissed';
      notificationType: string;
      title: string;
      timestamp: Date;
      campaignId: string;
    }> = [];

    // Create notification activity from votes
    user.votes.forEach((vote, index) => {
      activities.push({
        id: `vote-${vote.id}`,
        type: index % 4 === 0 ? 'opened' : index % 4 === 1 ? 'delivered' : index % 4 === 2 ? 'sent' : 'dismissed',
        notificationType: 'vote_milestone',
        title: `Vote milestone reached: "${vote.campaign.title}"`,
        timestamp: new Date(vote.createdAt.getTime() + Math.random() * 3600000), // Add some randomness
        campaignId: vote.campaign.id,
      });
    });

    // Create notification activity from comments
    user.comments.forEach((comment, index) => {
      activities.push({
        id: `comment-${comment.id}`,
        type: index % 3 === 0 ? 'opened' : index % 3 === 1 ? 'delivered' : 'sent',
        notificationType: 'comment_reply',
        title: `New activity on: "${comment.campaign.title}"`,
        timestamp: new Date(comment.createdAt.getTime() + Math.random() * 3600000),
        campaignId: comment.campaign.id,
      });
    });

    // Create notification activity from campaigns
    user.campaigns.forEach((campaign, index) => {
      activities.push({
        id: `campaign-${campaign.id}`,
        type: index % 2 === 0 ? 'delivered' : 'sent',
        notificationType: 'campaign_created',
        title: `Your campaign was published: "${campaign.title}"`,
        timestamp: new Date(campaign.createdAt.getTime() + Math.random() * 1800000),
        campaignId: campaign.id,
      });
    });

    // Sort by timestamp (most recent first) and limit to 20
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return NextResponse.json(sortedActivities);
  } catch (error) {
    console.error('Error fetching notification activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}