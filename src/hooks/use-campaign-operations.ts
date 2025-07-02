/**
 * Campaign Operations Hook with Cache Management
 *
 * This hook provides campaign CRUD operations with automatic cache invalidation
 * and optimistic updates for better user experience.
 */

import { api } from '~/lib/trpc';
import {
  simpleCacheStrategies,
  cacheConfig,
} from '~/lib/simple-cache-invalidation';

// Type aliases for better readability (unused for now but kept for future expansion)
// type CampaignCreateInput = RouterInputs['campaigns']['create'];
// type CampaignUpdateInput = RouterInputs['campaigns']['update'];
// type CampaignVoteInput = RouterInputs['campaigns']['vote'];

// Extended campaign type for optimistic updates
interface OptimisticCampaign {
  id: string;
  title: string;
  description: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  _count: { votes: number; comments: number };
}

// Extended campaign with user vote for optimistic UI
interface CampaignWithUserVote {
  userVote?: 'SUPPORT' | 'OPPOSE';
  _count?: { votes?: number; comments?: number };
}

/**
 * Comprehensive campaign operations hook
 */
export function useCampaignOperations() {
  const utils = api.useUtils();

  // Campaign creation with basic optimistic updates
  const createCampaign = api.campaigns.create.useMutation({
    onMutate: async (newCampaign) => {
      // Cancel any ongoing refetches for user campaigns to prevent overwriting optimistic update
      await utils.campaigns.getMyCampaigns.cancel();

      // Get current user campaigns data for rollback
      const previousUserCampaigns = utils.campaigns.getMyCampaigns.getData({});

      // Optimistically add to user campaigns if data exists
      if (previousUserCampaigns) {
        const optimisticCampaign: OptimisticCampaign = {
          id: `temp-${Date.now()}`, // Temporary ID
          title: newCampaign.title,
          description: newCampaign.description,
          status: newCampaign.status || 'DRAFT',
          latitude: newCampaign.latitude || null,
          longitude: newCampaign.longitude || null,
          address: newCampaign.address || null,
          city: newCampaign.city || null,
          state: newCampaign.state || null,
          createdAt: new Date(),
          _count: { votes: 0, comments: 0 },
        };

        utils.campaigns.getMyCampaigns.setData({}, (old) => {
          if (!old) return old;
          return {
            ...old,
            campaigns: [
              optimisticCampaign as (typeof old.campaigns)[0],
              ...old.campaigns,
            ],
          };
        });
      }

      return { previousUserCampaigns };
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousUserCampaigns) {
        utils.campaigns.getMyCampaigns.setData(
          {},
          context.previousUserCampaigns
        );
      }
      console.error('Campaign creation failed:', error);
    },
    onSuccess: async () => {
      try {
        await simpleCacheStrategies.campaignCreated(utils);
      } catch (error) {
        console.warn(
          'Cache invalidation failed after campaign creation:',
          error
        );
      }
    },
  });

  // Campaign update with optimistic updates
  const updateCampaign = api.campaigns.update.useMutation({
    onMutate: async (updatedCampaign) => {
      // Cancel any ongoing queries for this specific campaign
      await utils.campaigns.getById.cancel({ id: updatedCampaign.id });

      // Get current campaign data for rollback
      const previousCampaign = utils.campaigns.getById.getData({
        id: updatedCampaign.id,
      });

      // Optimistically update campaign details if data exists
      if (previousCampaign) {
        utils.campaigns.getById.setData({ id: updatedCampaign.id }, (old) => {
          if (!old) return old;
          return {
            ...old,
            ...updatedCampaign,
            updatedAt: new Date(),
          };
        });
      }

      return { previousCampaign };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousCampaign) {
        utils.campaigns.getById.setData(
          { id: variables.id },
          context.previousCampaign
        );
      }
      console.error('Campaign update failed:', error);
    },
    onSuccess: async (_, variables) => {
      try {
        await simpleCacheStrategies.campaignUpdated(utils, variables.id, 'all');
      } catch (error) {
        console.warn('Cache invalidation failed after campaign update:', error);
      }
    },
  });

  // Campaign deletion with optimistic updates
  const deleteCampaign = api.campaigns.delete.useMutation({
    onMutate: async (variables) => {
      // Cancel queries for this campaign
      await utils.campaigns.getById.cancel({ id: variables.id });
      await utils.campaigns.getMyCampaigns.cancel();

      // Get current data for potential rollback
      const previousCampaign = utils.campaigns.getById.getData({
        id: variables.id,
      });
      const previousUserCampaigns = utils.campaigns.getMyCampaigns.getData({});

      // Optimistically remove from user campaigns if data exists
      if (previousUserCampaigns) {
        utils.campaigns.getMyCampaigns.setData({}, (old) => {
          if (!old) return old;
          return {
            ...old,
            campaigns: old.campaigns.filter(
              (campaign) => campaign.id !== variables.id
            ),
          };
        });
      }

      return { previousCampaign, previousUserCampaigns };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousUserCampaigns) {
        utils.campaigns.getMyCampaigns.setData(
          {},
          context.previousUserCampaigns
        );
      }
      console.error('Campaign deletion failed:', error);
    },
    onSuccess: async () => {
      try {
        await simpleCacheStrategies.campaignDeleted(utils);
      } catch (error) {
        console.warn(
          'Cache invalidation failed after campaign deletion:',
          error
        );
      }
    },
  });

  // Campaign voting with optimistic updates - MOST IMPORTANT FOR UX
  const voteCampaign = api.campaigns.vote.useMutation({
    onMutate: async (voteData) => {
      // Cancel any ongoing queries for this campaign
      await utils.campaigns.getById.cancel({ id: voteData.campaignId });

      // Get the current campaign data for rollback
      const previousCampaign = utils.campaigns.getById.getData({
        id: voteData.campaignId,
      });

      // Optimistically update the campaign's vote count and user vote status
      if (previousCampaign) {
        utils.campaigns.getById.setData({ id: voteData.campaignId }, (old) => {
          if (!old) return old;

          // Calculate new vote counts based on vote type
          const currentVotes = old._count?.votes || 0;
          const newVoteCount = currentVotes + 1; // Simplified - in real app you'd track vote types

          return {
            ...old,
            _count: {
              ...old._count,
              votes: newVoteCount,
            },
            // Add user-specific vote tracking for immediate UI feedback
            userVote: voteData.voteType, // Custom field for tracking user's vote
          } as typeof old & CampaignWithUserVote; // Type assertion to allow custom userVote field
        });
      }

      return { previousCampaign };
    },
    onError: (error, variables, context) => {
      // Rollback the optimistic update on error
      if (context?.previousCampaign) {
        utils.campaigns.getById.setData(
          { id: variables.campaignId },
          context.previousCampaign
        );
      }
      console.error('Vote failed:', error);
    },
    onSuccess: async (_, variables) => {
      try {
        await simpleCacheStrategies.voteChanged(utils, variables.campaignId);
      } catch (error) {
        console.warn('Cache invalidation failed after vote:', error);
      }
    },
  });

  // Background data refresh
  const refreshCampaignData = async () => {
    try {
      await simpleCacheStrategies.backgroundRefresh(utils);
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  };

  // Prefetch campaign data
  const prefetchCampaign = async (campaignId: string) => {
    try {
      await utils.campaigns.getById.prefetch({ id: campaignId });
    } catch (error) {
      console.warn('Campaign prefetch failed:', error);
    }
  };

  // Prefetch search results
  const prefetchSearchResults = async (
    query?: string,
    location?: { latitude: number; longitude: number }
  ) => {
    try {
      await utils.campaigns.search.prefetch({
        query,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
    } catch (error) {
      console.warn('Search prefetch failed:', error);
    }
  };

  return {
    // Mutations
    createCampaign,
    updateCampaign,
    deleteCampaign,
    voteCampaign,

    // Utilities
    refreshCampaignData,
    prefetchCampaign,
    prefetchSearchResults,

    // Loading states
    isCreating: createCampaign.isPending,
    isUpdating: updateCampaign.isPending,
    isDeleting: deleteCampaign.isPending,
    isVoting: voteCampaign.isPending,

    // Error states
    createError: createCampaign.error,
    updateError: updateCampaign.error,
    deleteError: deleteCampaign.error,
    voteError: voteCampaign.error,
  };
}

/**
 * Campaign queries hook with cache management
 */
export function useCampaignQueries() {
  // const utils = api.useUtils(); // Unused for now but kept for future expansion

  // Get campaign by ID with cache configuration
  const getCampaign = (campaignId: string) => {
    return api.campaigns.getById.useQuery(
      { id: campaignId },
      {
        staleTime: cacheConfig.staleTime.campaigns,
        gcTime: cacheConfig.gcTime.campaigns,
        refetchOnWindowFocus: true,
        retry: (failureCount, error: unknown) => {
          // Don't retry on 404s
          if (error && typeof error === 'object' && 'data' in error) {
            const trpcError = error as { data?: { code?: string } };
            if (trpcError.data?.code === 'NOT_FOUND') {
              return false;
            }
          }
          return failureCount < 3;
        },
      }
    );
  };

  // Search campaigns with cache management
  const searchCampaigns = (
    query?: string,
    location?: { latitude: number; longitude: number },
    filters?: { status?: unknown; city?: string }
  ) => {
    return api.campaigns.search.useQuery(
      {
        query,
        latitude: location?.latitude,
        longitude: location?.longitude,
        status: filters?.status as
          | 'DRAFT'
          | 'ACTIVE'
          | 'COMPLETED'
          | 'CANCELLED'
          | undefined,
        city: filters?.city,
      },
      {
        staleTime: cacheConfig.staleTime.campaigns,
        gcTime: cacheConfig.gcTime.campaigns,
        refetchOnWindowFocus: true,
        placeholderData: (prev) => prev, // Keep previous results while loading new ones
      }
    );
  };

  // Get user's campaigns
  const getUserCampaigns = () => {
    return api.campaigns.getMyCampaigns.useQuery(
      {},
      {
        staleTime: cacheConfig.staleTime.campaigns,
        gcTime: cacheConfig.gcTime.campaigns,
        refetchOnWindowFocus: true,
      }
    );
  };

  // Find nearby campaigns
  const findNearbyCampaigns = (
    latitude: number,
    longitude: number,
    limit = 10
  ) => {
    return api.campaigns.findNearby.useQuery(
      { latitude, longitude, limit },
      {
        staleTime: cacheConfig.staleTime.campaigns,
        gcTime: cacheConfig.gcTime.campaigns,
        enabled: !!(latitude && longitude), // Only run if coordinates are provided
        placeholderData: (prev) => prev,
      }
    );
  };

  return {
    getCampaign,
    searchCampaigns,
    getUserCampaigns,
    findNearbyCampaigns,
  };
}
