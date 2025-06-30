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

/**
 * Comprehensive campaign operations hook
 */
export function useCampaignOperations() {
  const utils = api.useUtils();

  // Campaign creation with cache invalidation
  const createCampaign = api.campaigns.create.useMutation({
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
    onError: (error) => {
      console.error('Campaign creation failed:', error);
    },
  });

  // Campaign update with cache invalidation
  const updateCampaign = api.campaigns.update.useMutation({
    onSuccess: async (_, variables) => {
      try {
        await simpleCacheStrategies.campaignUpdated(utils, variables.id, 'all');
      } catch (error) {
        console.warn('Cache invalidation failed after campaign update:', error);
      }
    },
    onError: (error) => {
      console.error('Campaign update failed:', error);
    },
  });

  // Campaign deletion with cache cleanup
  const deleteCampaign = api.campaigns.delete.useMutation({
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
    onError: (error) => {
      console.error('Campaign deletion failed:', error);
    },
  });

  // Campaign voting with cache invalidation
  const voteCampaign = api.campaigns.vote.useMutation({
    onSuccess: async (_, variables) => {
      try {
        await simpleCacheStrategies.voteChanged(utils, variables.campaignId);
      } catch (error) {
        console.warn('Cache invalidation failed after vote:', error);
      }
    },
    onError: (error) => {
      console.error('Vote failed:', error);
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
