/**
 * Real-time hooks for campaign functionality
 * Provides hooks for real-time updates to campaigns, participants, and notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import { useToast } from '~/components/ui/use-toast';
import {
  useRealtimeConnection,
  useRealtimeCampaign as useBasicRealtimeCampaign,
  useRealtimeParticipants as useBasicRealtimeParticipants,
  useRealtimeNotifications,
  ConnectionStatus,
  CampaignRealtimeEvent,
  ParticipantRealtimeEvent,
  NotificationRealtimeEvent,
} from '~/lib/realtime';
import { CampaignStatus, VoteType } from '~/generated/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Campaign with real-time updates
 */
export interface RealtimeCampaign {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  creatorId: string;
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    firstName: string;
    lastName: string;
    imageUrl: string | null;
  };
  _count?: {
    votes: number;
    comments: number;
  };
}

/**
 * Campaign participant with real-time updates
 */
export interface RealtimeParticipant {
  id: string;
  campaignId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  user?: {
    firstName: string;
    lastName: string;
    imageUrl: string | null;
  };
}

/**
 * Campaign notification with real-time updates
 */
export interface RealtimeCampaignNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: {
    campaignId?: string;
    campaignTitle?: string;
    participantId?: string;
    participantName?: string;
    voteCount?: number;
    commentCount?: number;
  };
  createdAt: Date;
}

/**
 * Optimistic action result
 */
export interface OptimisticActionResult {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Campaign connection status
 */
export interface CampaignConnectionStatus {
  status: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  hasError: boolean;
  lastUpdated: Date | null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Hook for single campaign real-time updates
 */
export function useRealtimeCampaign(
  campaignId: string,
  options: {
    enabled?: boolean;
    includeParticipants?: boolean;
    onParticipantJoin?: (participant: RealtimeParticipant) => void;
    onParticipantLeave?: (participant: RealtimeParticipant) => void;
    onStatusChange?: (campaign: RealtimeCampaign) => void;
  } = {}
) {
  const {
    enabled = true,
    includeParticipants = true,
    onParticipantJoin,
    onParticipantLeave,
    onStatusChange,
  } = options;

  const { userId } = useAuth();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<RealtimeCampaign | null>(null);
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<CampaignConnectionStatus>({
      status: ConnectionStatus.CONNECTING,
      isConnected: false,
      isConnecting: true,
      isReconnecting: false,
      hasError: false,
      lastUpdated: null,
    });

  // Setup real-time connection
  useRealtimeConnection({
    enabled,
    onStatusChange: (status) => {
      setConnectionStatus({
        status,
        isConnected: status === ConnectionStatus.CONNECTED,
        isConnecting: status === ConnectionStatus.CONNECTING,
        isReconnecting: status === ConnectionStatus.RECONNECTING,
        hasError:
          status === ConnectionStatus.ERROR ||
          status === ConnectionStatus.DISCONNECTED,
        lastUpdated: new Date(),
      });
    },
    onError: (error) => {
      toast({
        title: 'Connection Error',
        description: `Failed to connect to real-time updates: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Fetch campaign data with tRPC
  const {
    data: campaignData,
    isLoading: isLoadingCampaign,
    error: campaignError,
    refetch: refetchCampaign,
  } = api.campaigns.getById.useQuery(
    { id: campaignId },
    {
      enabled: enabled && !!campaignId,
      refetchOnWindowFocus: false,
    }
  );

  // Subscribe to campaign updates
  const { isLoading: isLoadingRealtimeCampaign } =
    useBasicRealtimeCampaign<CampaignRealtimeEvent>(campaignId, {
      enabled: enabled && !!campaignId,
      onUpdate: (updatedCampaign) => {
        setCampaign((prev) => {
          if (!prev) return null;

          const updated = {
            ...prev,
            ...updatedCampaign,
            createdAt: new Date(updatedCampaign.createdAt),
            updatedAt: new Date(updatedCampaign.updatedAt),
          };

          // Notify status change if status changed
          if (prev.status !== updated.status && onStatusChange) {
            onStatusChange(updated);
          }

          return updated;
        });
      },
    });

  // Subscribe to participant updates if enabled
  const { isLoading: isLoadingParticipants } =
    useBasicRealtimeParticipants<ParticipantRealtimeEvent>(campaignId, {
      enabled: enabled && includeParticipants && !!campaignId,
      onInsert: (newParticipant) => {
        setParticipants((prev) => {
          const participant = {
            ...newParticipant,
            joinedAt: new Date(newParticipant.joinedAt),
          };

          // Notify participant join
          if (onParticipantJoin) {
            onParticipantJoin(participant);
          }

          // Update campaign participant count
          setCampaign((prevCampaign) => {
            if (!prevCampaign) return null;
            return {
              ...prevCampaign,
              participantCount: prevCampaign.participantCount + 1,
            };
          });

          return [...prev, participant];
        });
      },
      onDelete: (deletedParticipant) => {
        setParticipants((prev) => {
          const participant = {
            ...deletedParticipant,
            joinedAt: new Date(deletedParticipant.joinedAt),
          };

          // Notify participant leave
          if (onParticipantLeave) {
            onParticipantLeave(participant);
          }

          // Update campaign participant count
          setCampaign((prevCampaign) => {
            if (!prevCampaign) return null;
            return {
              ...prevCampaign,
              participantCount: Math.max(0, prevCampaign.participantCount - 1),
            };
          });

          return prev.filter((p) => p.id !== deletedParticipant.id);
        });
      },
    });

  // Update campaign state when data changes
  useEffect(() => {
    if (campaignData) {
      setCampaign({
        ...campaignData,
        createdAt: new Date(campaignData.createdAt),
        updatedAt: new Date(campaignData.updatedAt),
      });
    }
  }, [campaignData]);

  // Check if current user is a participant
  const isParticipant = userId
    ? participants.some((p) => p.userId === userId)
    : false;

  // Check if current user is the creator
  const isCreator = userId ? campaign?.creatorId === userId : false;

  return {
    campaign,
    participants,
    isParticipant,
    isCreator,
    isLoading:
      isLoadingCampaign || isLoadingRealtimeCampaign || isLoadingParticipants,
    error: campaignError,
    connectionStatus,
    refetch: refetchCampaign,
  };
}

/**
 * Hook for campaign list real-time updates
 */
export function useRealtimeCampaignList(
  options: {
    query?: string;
    city?: string;
    status?: CampaignStatus;
    latitude?: number;
    longitude?: number;
    limit?: number;
    enabled?: boolean;
    onNewCampaign?: (campaign: RealtimeCampaign) => void;
    onCampaignUpdate?: (campaign: RealtimeCampaign) => void;
    onCampaignRemove?: (campaignId: string) => void;
  } = {}
) {
  const {
    query,
    city,
    status,
    latitude,
    longitude,
    limit = 20,
    enabled = true,
    onNewCampaign,
    onCampaignUpdate,
    onCampaignRemove,
  } = options;

  const [campaigns, setCampaigns] = useState<RealtimeCampaign[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<CampaignConnectionStatus>({
      status: ConnectionStatus.CONNECTING,
      isConnected: false,
      isConnecting: true,
      isReconnecting: false,
      hasError: false,
      lastUpdated: null,
    });

  // Setup real-time connection
  useRealtimeConnection({
    enabled,
    onStatusChange: (status) => {
      setConnectionStatus({
        status,
        isConnected: status === ConnectionStatus.CONNECTED,
        isConnecting: status === ConnectionStatus.CONNECTING,
        isReconnecting: status === ConnectionStatus.RECONNECTING,
        hasError:
          status === ConnectionStatus.ERROR ||
          status === ConnectionStatus.DISCONNECTED,
        lastUpdated: new Date(),
      });
    },
  });

  // Determine which query to use based on parameters
  const useGeoSearch = latitude !== undefined && longitude !== undefined;

  // Fetch campaigns with geographic search
  const {
    data: nearbyData,
    isLoading: isLoadingNearby,
    error: nearbyError,
    refetch: refetchNearby,
  } = api.campaigns.findNearby.useQuery(
    {
      latitude: latitude || 0,
      longitude: longitude || 0,
      limit,
    },
    {
      enabled: enabled && useGeoSearch,
      refetchOnWindowFocus: false,
    }
  );

  // Fetch campaigns with regular search
  const {
    data: searchData,
    isLoading: isLoadingSearch,
    error: searchError,
    refetch: refetchSearch,
  } = api.campaigns.search.useQuery(
    {
      query: query,
      city,
      status,
      limit,
    },
    {
      enabled: enabled && !useGeoSearch,
      refetchOnWindowFocus: false,
    }
  );

  // Update campaigns state when data changes
  useEffect(() => {
    if (useGeoSearch && nearbyData) {
      setCampaigns(
        nearbyData.campaigns.map((campaign) => ({
          ...campaign,
          createdAt: new Date(campaign.createdAt),
          updatedAt: new Date(campaign.createdAt), // Assuming updatedAt is not in the response
        }))
      );
    } else if (searchData) {
      setCampaigns(
        searchData.campaigns.map((campaign) => ({
          ...campaign,
          createdAt: new Date(campaign.createdAt),
          updatedAt: new Date(campaign.createdAt), // Assuming updatedAt is not in the response
        }))
      );
    }
  }, [nearbyData, searchData, useGeoSearch]);

  // Subscribe to campaign updates for the current search area
  useEffect(() => {
    if (!enabled || !connectionStatus.isConnected) return;

    // This would be a more complex implementation that subscribes to
    // campaigns within the current search area or matching the current filters
    // For now, we'll rely on refetching data when we receive general campaign updates

    // In a real implementation, we'd use Supabase's Realtime features to filter by
    // geographic area or other search criteria

    const intervalId = setInterval(() => {
      if (useGeoSearch) {
        refetchNearby();
      } else {
        refetchSearch();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [
    connectionStatus.isConnected,
    enabled,
    refetchNearby,
    refetchSearch,
    useGeoSearch,
  ]);

  // Handle campaign updates
  const handleCampaignUpdate = useCallback(
    (updatedCampaign: RealtimeCampaign) => {
      setCampaigns((prev) => {
        // Check if campaign exists in the list
        const index = prev.findIndex((c) => c.id === updatedCampaign.id);

        if (index >= 0) {
          // Update existing campaign
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            ...updatedCampaign,
            createdAt: new Date(updatedCampaign.createdAt),
            updatedAt: new Date(updatedCampaign.updatedAt),
          };

          // Notify campaign update
          if (onCampaignUpdate) {
            onCampaignUpdate(updated[index]);
          }

          return updated;
        } else if (
          // Add new campaign if it matches the current filters
          (!status || updatedCampaign.status === status) &&
          (!city || updatedCampaign.city === city)
        ) {
          const newCampaign = {
            ...updatedCampaign,
            createdAt: new Date(updatedCampaign.createdAt),
            updatedAt: new Date(updatedCampaign.updatedAt),
          };

          // Notify new campaign
          if (onNewCampaign) {
            onNewCampaign(newCampaign);
          }

          return [...prev, newCampaign];
        }

        return prev;
      });
    },
    [city, onCampaignUpdate, onNewCampaign, status]
  );

  // Handle campaign removal
  const handleCampaignRemove = useCallback(
    (campaignId: string) => {
      setCampaigns((prev) => {
        // Check if campaign exists in the list
        const index = prev.findIndex((c) => c.id === campaignId);

        if (index >= 0) {
          // Notify campaign removal
          if (onCampaignRemove) {
            onCampaignRemove(campaignId);
          }

          // Remove campaign from list
          const updated = [...prev];
          updated.splice(index, 1);
          return updated;
        }

        return prev;
      });
    },
    [onCampaignRemove]
  );

  return {
    campaigns,
    isLoading: isLoadingNearby || isLoadingSearch,
    error: nearbyError || searchError,
    connectionStatus,
    refetch: useGeoSearch ? refetchNearby : refetchSearch,
    updateCampaign: handleCampaignUpdate,
    removeCampaign: handleCampaignRemove,
  };
}

/**
 * Hook for campaign participant management
 */
export function useCampaignParticipants(
  campaignId: string,
  options: {
    enabled?: boolean;
    onJoin?: (participant: RealtimeParticipant) => void;
    onLeave?: (participant: RealtimeParticipant) => void;
    onRoleChange?: (
      participant: RealtimeParticipant,
      previousRole: string
    ) => void;
  } = {}
) {
  const { enabled = true, onJoin, onLeave, onRoleChange } = options;

  const { userId } = useAuth();
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [isCurrentUserParticipant, setIsCurrentUserParticipant] =
    useState(false);

  // Fetch participants with tRPC
  // Note: This would be a real endpoint in a complete implementation
  const {
    data: participantsData,
    isLoading,
    error,
    refetch,
  } = api.campaigns.getById.useQuery(
    { id: campaignId },
    {
      enabled: enabled && !!campaignId,
      refetchOnWindowFocus: false,
      // In a real implementation, we'd have a separate endpoint for participants.
      // For now, simply return an empty array to keep types consistent.
      select: () => ({ participants: [] }),
    }
  );

  // Subscribe to participant updates
  const { isLoading: isLoadingRealtime } =
    useBasicRealtimeParticipants<ParticipantRealtimeEvent>(campaignId, {
      enabled: enabled && !!campaignId,
      onInsert: (newParticipant) => {
        const participant = {
          ...newParticipant,
          joinedAt: new Date(newParticipant.joinedAt),
        };

        setParticipants((prev) => {
          // Check if participant already exists
          if (prev.some((p) => p.id === participant.id)) {
            return prev;
          }

          // Notify join
          if (onJoin) {
            onJoin(participant);
          }

          // Check if current user is the participant
          if (userId && participant.userId === userId) {
            setIsCurrentUserParticipant(true);
          }

          return [...prev, participant];
        });
      },
      onUpdate: (updatedParticipant) => {
        const participant = {
          ...updatedParticipant,
          joinedAt: new Date(updatedParticipant.joinedAt),
        };

        setParticipants((prev) => {
          // Find existing participant
          const index = prev.findIndex((p) => p.id === participant.id);

          if (index >= 0) {
            // Check for role change
            if (onRoleChange && prev[index].role !== participant.role) {
              onRoleChange(participant, prev[index].role);
            }

            // Update participant
            const updated = [...prev];
            updated[index] = participant;
            return updated;
          }

          return prev;
        });
      },
      onDelete: (deletedParticipant) => {
        const participant = {
          ...deletedParticipant,
          joinedAt: new Date(deletedParticipant.joinedAt),
        };

        setParticipants((prev) => {
          // Find existing participant
          const index = prev.findIndex((p) => p.id === participant.id);

          if (index >= 0) {
            // Notify leave
            if (onLeave) {
              onLeave(participant);
            }

            // Check if current user is the participant
            if (userId && participant.userId === userId) {
              setIsCurrentUserParticipant(false);
            }

            // Remove participant
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
          }

          return prev;
        });
      },
    });

  // Update participants state when data changes
  useEffect(() => {
    if (participantsData?.participants) {
      setParticipants(participantsData.participants);

      // Check if current user is a participant
      if (userId) {
        setIsCurrentUserParticipant(
          participantsData.participants.some((p) => p.userId === userId)
        );
      }
    }
  }, [participantsData, userId]);

  // Join campaign mutation
  const joinMutation = api.campaigns.join.useMutation();

  // Leave campaign mutation
  const leaveMutation = api.campaigns.leave.useMutation();

  // Join campaign function
  const joinCampaign = useCallback(async () => {
    if (!campaignId || !userId) return;

    try {
      await joinMutation.mutateAsync({ campaignId });
      return true;
    } catch (error) {
      console.error('Failed to join campaign:', error);
      return false;
    }
  }, [campaignId, joinMutation, userId]);

  // Leave campaign function
  const leaveCampaign = useCallback(async () => {
    if (!campaignId || !userId) return;

    try {
      await leaveMutation.mutateAsync({ campaignId });
      return true;
    } catch (error) {
      console.error('Failed to leave campaign:', error);
      return false;
    }
  }, [campaignId, leaveMutation, userId]);

  return {
    participants,
    isCurrentUserParticipant,
    isLoading: isLoading || isLoadingRealtime,
    error,
    joinCampaign,
    leaveCampaign,
    refetch,
  };
}

/**
 * Hook for optimistic campaign actions
 */
export function useOptimisticCampaignAction<U>(
  options: {
    onSuccess?: (data: U) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
  } = {}
) {
  const { onSuccess, onError, onSettled } = options;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Reset state
  const reset = useCallback(() => {
    setIsLoading(false);
    setIsError(false);
    setError(null);
  }, []);

  // Execute action with optimistic updates
  const execute = useCallback(
    async <R>(
      action: () => Promise<R>,
      optimisticUpdate: () => U,
      rollback: () => void,
      successMessage?: string,
      errorMessage?: string
    ): Promise<R | undefined> => {
      // Reset state
      setIsError(false);
      setError(null);

      // Set loading state
      setIsLoading(true);

      try {
        // Apply optimistic update
        const optimisticData = optimisticUpdate();

        // Execute actual action
        const result = await action();

        // Action succeeded
        setIsLoading(false);

        // Show success message
        if (successMessage) {
          toast({
            title: 'Success',
            description: successMessage,
            variant: 'default',
          });
        }

        // Call onSuccess callback
        if (onSuccess) {
          onSuccess(optimisticData);
        }

        // Call onSettled callback
        if (onSettled) {
          onSettled();
        }

        return result;
      } catch (err) {
        // Action failed
        setIsLoading(false);
        setIsError(true);

        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);

        // Rollback optimistic update
        rollback();

        // Show error message
        toast({
          title: 'Error',
          description: errorMessage || errorObj.message,
          variant: 'destructive',
        });

        // Call onError callback
        if (onError) {
          onError(errorObj);
        }

        // Call onSettled callback
        if (onSettled) {
          onSettled();
        }
      }
    },
    [onSuccess, onError, onSettled, toast]
  );

  return {
    execute,
    isLoading,
    isError,
    error,
    reset,
  };
}

/**
 * Hook for optimistic campaign participation
 */
export function useOptimisticParticipation(campaignId: string) {
  const { userId } = useAuth();
  const [isParticipant, setIsParticipant] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  // Join campaign mutation
  const joinMutation = api.campaigns.join.useMutation();

  // Leave campaign mutation
  const leaveMutation = api.campaigns.leave.useMutation();

  // Get campaign to check if user is already a participant
  const { isLoading } = api.campaigns.getById.useQuery(
    { id: campaignId },
    {
      enabled: !!campaignId,
      refetchOnWindowFocus: false,
      onSuccess: (campaign) => {
        // In a real implementation, we'd check if the user is a participant
        // and set the initial state accordingly
        setParticipantCount(campaign.participantCount || 0);
      },
    }
  );

  // Setup optimistic action hook
  const {
    execute,
    isLoading: isActionLoading,
    isError,
    error,
  } = useOptimisticCampaignAction<
    | { joined: boolean; campaignId: string }
    | { left: boolean; campaignId: string }
  >();

  // Join campaign with optimistic update
  const joinCampaign = useCallback(async () => {
    if (!campaignId || !userId || isParticipant) return;

    return execute(
      // Actual action
      () => joinMutation.mutateAsync({ campaignId }),

      // Optimistic update
      () => {
        setIsParticipant(true);
        setParticipantCount((prev) => prev + 1);
        return { joined: true, campaignId };
      },

      // Rollback
      () => {
        setIsParticipant(false);
        setParticipantCount((prev) => Math.max(0, prev - 1));
      },

      // Success message
      "You've joined the campaign!",

      // Error message
      'Failed to join campaign'
    );
  }, [campaignId, execute, isParticipant, joinMutation, userId]);

  // Leave campaign with optimistic update
  const leaveCampaign = useCallback(async () => {
    if (!campaignId || !userId || !isParticipant) return;

    return execute(
      // Actual action
      () => leaveMutation.mutateAsync({ campaignId }),

      // Optimistic update
      () => {
        setIsParticipant(false);
        setParticipantCount((prev) => Math.max(0, prev - 1));
        return { left: true, campaignId };
      },

      // Rollback
      () => {
        setIsParticipant(true);
        setParticipantCount((prev) => prev + 1);
      },

      // Success message
      "You've left the campaign",

      // Error message
      'Failed to leave campaign'
    );
  }, [campaignId, execute, isParticipant, leaveMutation, userId]);

  return {
    isParticipant,
    participantCount,
    joinCampaign,
    leaveCampaign,
    isLoading: isLoading || isActionLoading,
    isError,
    error,
  };
}

/**
 * Hook for optimistic campaign voting
 */
export function useOptimisticVoting(campaignId: string) {
  const { userId } = useAuth();
  const [currentVote, setCurrentVote] = useState<VoteType | null>(null);
  const [voteCount, setVoteCount] = useState({ up: 0, down: 0 });

  // Vote mutation
  const voteMutation = api.campaigns.vote.useMutation();

  // Setup optimistic action hook
  const { execute, isLoading, isError, error } = useOptimisticCampaignAction<{
    voted: boolean;
    voteType: VoteType;
    campaignId: string;
  }>();

  // Vote with optimistic update
  const vote = useCallback(
    async (voteType: VoteType) => {
      if (!campaignId || !userId) return;

      const isChangingVote = currentVote !== null && currentVote !== voteType;
      const isRemovingVote = currentVote === voteType;

      return execute(
        // Actual action
        () => voteMutation.mutateAsync({ campaignId, voteType }),

        // Optimistic update
        () => {
          // Calculate new vote counts
          const newVoteCount = { ...voteCount };

          if (isRemovingVote) {
            // Removing vote
            if (voteType === VoteType.UP) {
              newVoteCount.up = Math.max(0, newVoteCount.up - 1);
            } else {
              newVoteCount.down = Math.max(0, newVoteCount.down - 1);
            }
            setCurrentVote(null);
          } else if (isChangingVote) {
            // Changing vote
            if (voteType === VoteType.UP) {
              newVoteCount.up += 1;
              newVoteCount.down = Math.max(0, newVoteCount.down - 1);
            } else {
              newVoteCount.down += 1;
              newVoteCount.up = Math.max(0, newVoteCount.up - 1);
            }
            setCurrentVote(voteType);
          } else {
            // New vote
            if (voteType === VoteType.UP) {
              newVoteCount.up += 1;
            } else {
              newVoteCount.down += 1;
            }
            setCurrentVote(voteType);
          }

          setVoteCount(newVoteCount);
          return { voted: true, voteType, campaignId };
        },

        // Rollback
        () => {
          setCurrentVote(currentVote);
          setVoteCount(voteCount);
        }
      );
    },
    [campaignId, currentVote, execute, userId, voteCount, voteMutation]
  );

  return {
    currentVote,
    voteCount,
    vote,
    isLoading,
    isError,
    error,
  };
}

/**
 * Hook for campaign-related notifications
 */
export function useCampaignNotifications(
  options: {
    campaignId?: string;
    enabled?: boolean;
    onNewNotification?: (notification: RealtimeCampaignNotification) => void;
  } = {}
) {
  const { campaignId, enabled = true, onNewNotification } = options;
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<
    RealtimeCampaignNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to notifications
  const { isLoading } = useRealtimeNotifications<NotificationRealtimeEvent>({
    enabled: enabled && !!userId,
    onInsert: (newNotification) => {
      // Check if notification is related to the specified campaign
      if (campaignId && newNotification.data.campaignId !== campaignId) {
        return;
      }

      const notification = {
        ...newNotification,
        createdAt: new Date(newNotification.createdAt),
        data: newNotification.data as RealtimeCampaignNotification['data'],
      };

      setNotifications((prev) => {
        // Check if notification already exists
        if (prev.some((n) => n.id === notification.id)) {
          return prev;
        }

        // Notify new notification
        if (onNewNotification) {
          onNewNotification(notification);
        }

        // Update unread count
        if (!notification.read) {
          setUnreadCount((prev) => prev + 1);
        }

        return [notification, ...prev];
      });
    },
    onUpdate: (updatedNotification) => {
      const notification = {
        ...updatedNotification,
        createdAt: new Date(updatedNotification.createdAt),
        data: updatedNotification.data as RealtimeCampaignNotification['data'],
      };

      setNotifications((prev) => {
        // Find existing notification
        const index = prev.findIndex((n) => n.id === notification.id);

        if (index >= 0) {
          // Update unread count if read status changed
          if (!prev[index].read && notification.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          } else if (prev[index].read && !notification.read) {
            setUnreadCount((prev) => prev + 1);
          }

          // Update notification
          const updated = [...prev];
          updated[index] = notification;
          return updated;
        }

        return prev;
      });
    },
  });

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    // In a real implementation, we'd have an API endpoint to mark notifications as read
    setNotifications((prev) => {
      // Find notification
      const index = prev.findIndex((n) => n.id === notificationId);

      if (index >= 0 && !prev[index].read) {
        // Update notification
        const updated = [...prev];
        updated[index] = { ...updated[index], read: true };

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        return updated;
      }

      return prev;
    });
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // In a real implementation, we'd have an API endpoint to mark all notifications as read
    setNotifications((prev) => {
      // Update all notifications
      const updated = prev.map((n) => ({ ...n, read: true }));

      // Reset unread count
      setUnreadCount(0);

      return updated;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
