/**
 * Database Performance Optimization Utilities
 *
 * This module provides optimized query helpers that leverage the database indexes
 * for improved performance on common operations.
 */

import { db } from '~/lib/db';
import { type Prisma, type CampaignStatus } from '~/generated/prisma';
import { getCacheWithFallback, campaignCacheKey, CACHE_TTL } from '~/lib/cache';

/**
 * Performance-optimized campaign queries using proper indexing
 */
export class CampaignQueries {
  /**
   * Get recent active campaigns (uses status + createdAt index)
   */
  static async getRecentActive(limit = 20) {
    return db.campaign.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc', // Leverages [status, createdAt] index
      },
      take: limit,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });
  }

  /**
   * Get user's campaigns with status filtering (uses creatorId + status index)
   */
  static async getUserCampaigns(
    userId: string,
    status?: CampaignStatus,
    limit = 20
  ) {
    const where: Prisma.CampaignWhereInput = {
      creatorId: userId,
    };

    if (status) {
      where.status = status; // Leverages [creatorId, status] index
    }

    return db.campaign.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });
  }

  /**
   * Get campaigns by city with status filtering (uses city + status index)
   */
  static async getCampaignsByCity(
    city: string,
    status: CampaignStatus = 'ACTIVE',
    limit = 20
  ) {
    return db.campaign.findMany({
      where: {
        city: {
          equals: city,
          mode: 'insensitive',
        },
        status, // Leverages [city, status] index
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });
  }

  /**
   * Get campaigns with geographic bounds (uses lat/lng index)
   */
  static async getCampaignsInBounds(
    northLat: number,
    southLat: number,
    eastLng: number,
    westLng: number,
    status: CampaignStatus = 'ACTIVE',
    limit = 50
  ) {
    return db.campaign.findMany({
      where: {
        AND: [
          {
            latitude: {
              gte: southLat,
              lte: northLat,
            },
          },
          {
            longitude: {
              gte: westLng,
              lte: eastLng, // Leverages [latitude, longitude] index
            },
          },
          {
            status,
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });
  }

  /**
   * Get campaign with caching for frequently accessed campaigns
   */
  static async getCampaignWithCache(campaignId: string) {
    const cacheKey = campaignCacheKey(campaignId);

    const result = await getCacheWithFallback(
      cacheKey,
      async () => {
        const campaign = await db.campaign.findUnique({
          where: { id: campaignId },
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
            _count: {
              select: {
                votes: true,
                comments: true,
              },
            },
          },
        });

        if (!campaign) {
          throw new Error('Campaign not found');
        }

        return campaign;
      },
      CACHE_TTL.CAMPAIGN_DETAIL
    );

    if (result.error) throw result.error;
    return result.data;
  }
}

/**
 * Performance-optimized vote queries using proper indexing
 */
export class VoteQueries {
  /**
   * Get vote counts for a campaign (uses campaignId + type index)
   */
  static async getCampaignVoteCounts(campaignId: string) {
    const [supportCount, opposeCount] = await Promise.all([
      db.vote.count({
        where: {
          campaignId,
          type: 'SUPPORT', // Leverages [campaignId, type] index
        },
      }),
      db.vote.count({
        where: {
          campaignId,
          type: 'OPPOSE', // Leverages [campaignId, type] index
        },
      }),
    ]);

    return {
      support: supportCount,
      oppose: opposeCount,
      total: supportCount + opposeCount,
    };
  }

  /**
   * Get user's voting history (uses userId + createdAt index)
   */
  static async getUserVotingHistory(userId: string, limit = 20) {
    return db.vote.findMany({
      where: {
        userId, // Leverages [userId, createdAt] index
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Get recent votes for a campaign (uses campaignId + createdAt index)
   */
  static async getRecentCampaignVotes(campaignId: string, limit = 10) {
    return db.vote.findMany({
      where: {
        campaignId, // Leverages [campaignId, createdAt] index
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });
  }
}

/**
 * Performance-optimized comment queries using proper indexing
 */
export class CommentQueries {
  /**
   * Get comments for a campaign (uses campaignId + createdAt index)
   */
  static async getCampaignComments(campaignId: string, limit = 20) {
    return db.comment.findMany({
      where: {
        campaignId, // Leverages [campaignId, createdAt] index
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get user's comments (uses authorId + createdAt index)
   */
  static async getUserComments(authorId: string, limit = 20) {
    return db.comment.findMany({
      where: {
        authorId, // Leverages [authorId, createdAt] index
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Get recent comments across the platform (uses createdAt index)
   */
  static async getRecentComments(limit = 20) {
    return db.comment.findMany({
      orderBy: {
        createdAt: 'desc', // Leverages [createdAt] index
      },
      take: limit,
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
          },
        },
      },
    });
  }
}

/**
 * Aggregate performance statistics and analytics
 */
export class AnalyticsQueries {
  /**
   * Get platform engagement statistics
   */
  static async getPlatformStats() {
    const [
      totalCampaigns,
      activeCampaigns,
      totalVotes,
      totalComments,
      totalUsers,
    ] = await Promise.all([
      db.campaign.count(),
      db.campaign.count({ where: { status: 'ACTIVE' } }),
      db.vote.count(),
      db.comment.count(),
      db.user.count(),
    ]);

    return {
      totalCampaigns,
      activeCampaigns,
      totalVotes,
      totalComments,
      totalUsers,
      engagementRate:
        totalUsers > 0 ? (totalVotes + totalComments) / totalUsers : 0,
    };
  }

  /**
   * Get most active cities
   */
  static async getCampaignsByCity(limit = 10) {
    return db.campaign.groupBy({
      by: ['city', 'state'],
      _count: {
        id: true,
      },
      where: {
        AND: [{ city: { not: null } }, { state: { not: null } }],
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });
  }
}
