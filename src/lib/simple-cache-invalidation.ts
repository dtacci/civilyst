/**
 * Simplified tRPC Cache Invalidation Utilities
 *
 * This module provides simple, working cache invalidation strategies for tRPC queries.
 * Focuses on practical invalidation without complex type gymnastics.
 */

import { api } from '~/lib/trpc';

/**
 * Simple cache invalidation strategies using the actual tRPC utils
 */
export const simpleCacheStrategies = {
  /**
   * Strategy for campaign creation
   */
  campaignCreated: async (utils: ReturnType<typeof api.useUtils>) => {
    // Invalidate campaign lists and searches
    await Promise.allSettled([
      utils.campaigns.search.invalidate(),
      utils.campaigns.getMyCampaigns.invalidate(),
      utils.campaigns.findNearby.invalidate(),
      utils.campaigns.findInBounds.invalidate(),
      utils.campaigns.getCityStats.invalidate(),
    ]);
  },

  /**
   * Strategy for campaign updates
   */
  campaignUpdated: async (
    utils: ReturnType<typeof api.useUtils>,
    campaignId: string,
    updateType: 'status' | 'content' | 'location' | 'all' = 'all'
  ) => {
    const promises = [
      // Always invalidate the specific campaign
      utils.campaigns.getById.invalidate({ id: campaignId }),
    ];

    // Status changes affect search results (draft vs active)
    if (updateType === 'status' || updateType === 'all') {
      promises.push(
        utils.campaigns.search.invalidate(),
        utils.campaigns.getMyCampaigns.invalidate()
      );
    }

    // Location changes affect geographic queries
    if (updateType === 'location' || updateType === 'all') {
      promises.push(
        utils.campaigns.findNearby.invalidate(),
        utils.campaigns.findInBounds.invalidate(),
        utils.campaigns.getCityStats.invalidate()
      );
    }

    // Content changes might affect search results
    if (updateType === 'content' || updateType === 'all') {
      promises.push(utils.campaigns.search.invalidate());
    }

    await Promise.allSettled(promises);
  },

  /**
   * Strategy for campaign deletion
   */
  campaignDeleted: async (utils: ReturnType<typeof api.useUtils>) => {
    await Promise.allSettled([
      utils.campaigns.search.invalidate(),
      utils.campaigns.getMyCampaigns.invalidate(),
      utils.campaigns.findNearby.invalidate(),
      utils.campaigns.findInBounds.invalidate(),
      utils.campaigns.getCityStats.invalidate(),
    ]);
  },

  /**
   * Strategy for voting
   */
  voteChanged: async (
    utils: ReturnType<typeof api.useUtils>,
    campaignId: string
  ) => {
    await Promise.allSettled([
      // Invalidate the campaign to update vote counts
      utils.campaigns.getById.invalidate({ id: campaignId }),
      // Invalidate search results that might show vote counts
      utils.campaigns.search.invalidate(),
      utils.campaigns.findNearby.invalidate(),
      utils.campaigns.findInBounds.invalidate(),
    ]);
  },

  /**
   * Strategy for commenting
   */
  commentAdded: async (
    utils: ReturnType<typeof api.useUtils>,
    campaignId: string
  ) => {
    await Promise.allSettled([
      // Invalidate the campaign to update comment counts
      utils.campaigns.getById.invalidate({ id: campaignId }),
    ]);
  },

  /**
   * Background refresh strategy
   */
  backgroundRefresh: async (utils: ReturnType<typeof api.useUtils>) => {
    await Promise.allSettled([
      // Refetch active campaigns in background
      utils.campaigns.search.refetch({ status: 'ACTIVE' }),
      utils.campaigns.getMyCampaigns.refetch(),
    ]);
  },
} as const;

/**
 * Cache invalidation configuration
 */
export const cacheConfig = {
  /**
   * Time after which to automatically refetch stale data (in ms)
   */
  staleTime: {
    campaigns: 5 * 60 * 1000, // 5 minutes
    comments: 2 * 60 * 1000, // 2 minutes
    votes: 30 * 1000, // 30 seconds
    userProfile: 10 * 60 * 1000, // 10 minutes
    geographic: 10 * 60 * 1000, // 10 minutes
  },

  /**
   * Garbage collection time before data is cleaned up (in ms)
   */
  gcTime: {
    campaigns: 10 * 60 * 1000, // 10 minutes
    comments: 5 * 60 * 1000, // 5 minutes
    votes: 2 * 60 * 1000, // 2 minutes
    userProfile: 30 * 60 * 1000, // 30 minutes
    geographic: 15 * 60 * 1000, // 15 minutes
  },

  /**
   * Whether to refetch on window focus
   */
  refetchOnWindowFocus: {
    campaigns: true,
    comments: true,
    votes: true,
    userProfile: false,
    geographic: false,
  },
} as const;
