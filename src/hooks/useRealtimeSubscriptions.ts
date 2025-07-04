'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getSubscriptionManager,
  type RealtimeEvent,
  type CampaignRealtimePayload,
  type CommentRealtimePayload,
  type VoteRealtimePayload,
} from '~/lib/supabase-realtime';

/**
 * Hook for managing campaign real-time updates
 */
export function useCampaignRealtimeUpdates(campaignId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionKeyRef = useRef<string | null>(null);
  const [lastUpdate, setLastUpdate] =
    useState<RealtimeEvent<CampaignRealtimePayload> | null>(null);

  const onUpdate = useCallback(
    (payload: RealtimeEvent<CampaignRealtimePayload>) => {
      setLastUpdate(payload);
      console.warn('Campaign update received:', payload);
    },
    []
  );

  useEffect(() => {
    if (!campaignId) return;

    const manager = getSubscriptionManager();
    if (!manager) return;

    // Clean up previous subscription
    if (subscriptionKeyRef.current) {
      manager.unsubscribe(subscriptionKeyRef.current);
    }

    // Subscribe to campaign updates
    subscriptionKeyRef.current = manager.subscribeToCampaignUpdates(
      campaignId,
      onUpdate
    );

    // Listen to connection status
    const unsubscribeConnection = manager.onConnectionChange(setIsConnected);

    return () => {
      if (subscriptionKeyRef.current) {
        manager.unsubscribe(subscriptionKeyRef.current);
        subscriptionKeyRef.current = null;
      }
      unsubscribeConnection();
    };
  }, [campaignId, onUpdate]);

  return {
    isConnected,
    lastUpdate,
    subscriptionActive: !!subscriptionKeyRef.current,
  };
}

/**
 * Hook for managing campaign comments real-time updates
 */
export function useCampaignCommentsRealtime(campaignId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionKeyRef = useRef<string | null>(null);
  const [newComment, setNewComment] =
    useState<RealtimeEvent<CommentRealtimePayload> | null>(null);
  const [commentCount, setCommentCount] = useState(0);

  const onComment = useCallback(
    (payload: RealtimeEvent<CommentRealtimePayload>) => {
      setNewComment(payload);

      // Update comment count based on event type
      if (payload.eventType === 'INSERT') {
        setCommentCount((prev) => prev + 1);
      } else if (payload.eventType === 'DELETE') {
        setCommentCount((prev) => Math.max(0, prev - 1));
      }

      console.warn('Comment update received:', payload);
    },
    []
  );

  useEffect(() => {
    if (!campaignId) return;

    const manager = getSubscriptionManager();
    if (!manager) return;

    // Clean up previous subscription
    if (subscriptionKeyRef.current) {
      manager.unsubscribe(subscriptionKeyRef.current);
    }

    // Subscribe to comment updates
    subscriptionKeyRef.current = manager.subscribeToCampaignComments(
      campaignId,
      onComment
    );

    // Listen to connection status
    const unsubscribeConnection = manager.onConnectionChange(setIsConnected);

    return () => {
      if (subscriptionKeyRef.current) {
        manager.unsubscribe(subscriptionKeyRef.current);
        subscriptionKeyRef.current = null;
      }
      unsubscribeConnection();
    };
  }, [campaignId, onComment]);

  return {
    isConnected,
    newComment,
    commentCount,
    subscriptionActive: !!subscriptionKeyRef.current,
  };
}

/**
 * Hook for managing campaign votes real-time updates
 */
export function useCampaignVotesRealtime(campaignId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionKeyRef = useRef<string | null>(null);
  const [newVote, setNewVote] =
    useState<RealtimeEvent<VoteRealtimePayload> | null>(null);
  const [voteCounts, setVoteCounts] = useState({
    support: 0,
    oppose: 0,
    neutral: 0,
  });

  const onVote = useCallback((payload: RealtimeEvent<VoteRealtimePayload>) => {
    setNewVote(payload);

    // Update vote counts based on event type and vote type
    const voteType = payload.new?.type || payload.old?.type;
    if (!voteType) return;

    const increment =
      payload.eventType === 'INSERT'
        ? 1
        : payload.eventType === 'DELETE'
          ? -1
          : 0;

    setVoteCounts((prev) => {
      const newCounts = { ...prev };

      if (voteType === 'SUPPORT') {
        newCounts.support = Math.max(0, prev.support + increment);
      } else if (voteType === 'OPPOSE') {
        newCounts.oppose = Math.max(0, prev.oppose + increment);
      } else if (voteType === 'NEUTRAL') {
        newCounts.neutral = Math.max(0, prev.neutral + increment);
      }

      return newCounts;
    });

    console.warn('Vote update received:', payload);
  }, []);

  useEffect(() => {
    if (!campaignId) return;

    const manager = getSubscriptionManager();
    if (!manager) return;

    // Clean up previous subscription
    if (subscriptionKeyRef.current) {
      manager.unsubscribe(subscriptionKeyRef.current);
    }

    // Subscribe to vote updates
    subscriptionKeyRef.current = manager.subscribeToCampaignVotes(
      campaignId,
      onVote
    );

    // Listen to connection status
    const unsubscribeConnection = manager.onConnectionChange(setIsConnected);

    return () => {
      if (subscriptionKeyRef.current) {
        manager.unsubscribe(subscriptionKeyRef.current);
        subscriptionKeyRef.current = null;
      }
      unsubscribeConnection();
    };
  }, [campaignId, onVote]);

  return {
    isConnected,
    newVote,
    voteCounts,
    totalVotes: voteCounts.support + voteCounts.oppose + voteCounts.neutral,
    subscriptionActive: !!subscriptionKeyRef.current,
  };
}

/**
 * Hook for managing active campaigns list real-time updates
 */
export function useActiveCampaignsRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionKeyRef = useRef<string | null>(null);
  const [campaignUpdate, setCampaignUpdate] =
    useState<RealtimeEvent<CampaignRealtimePayload> | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  const onCampaignUpdate = useCallback(
    (payload: RealtimeEvent<CampaignRealtimePayload>) => {
      setCampaignUpdate(payload);
      setUpdateCount((prev) => prev + 1);
      console.warn('Active campaigns update received:', payload);
    },
    []
  );

  useEffect(() => {
    const manager = getSubscriptionManager();
    if (!manager) return;

    // Subscribe to active campaigns
    subscriptionKeyRef.current =
      manager.subscribeToActiveCampaigns(onCampaignUpdate);

    // Listen to connection status
    const unsubscribeConnection = manager.onConnectionChange(setIsConnected);

    return () => {
      if (subscriptionKeyRef.current) {
        manager.unsubscribe(subscriptionKeyRef.current);
        subscriptionKeyRef.current = null;
      }
      unsubscribeConnection();
    };
  }, [onCampaignUpdate]);

  return {
    isConnected,
    campaignUpdate,
    updateCount,
    subscriptionActive: !!subscriptionKeyRef.current,
  };
}

/**
 * Hook for managing general real-time connection status
 */
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMetrics, setConnectionMetrics] = useState({
    activeSubscriptions: 0,
    subscriptionCount: 0,
  });

  useEffect(() => {
    const manager = getSubscriptionManager();
    if (!manager) return;

    // Listen to connection changes
    const unsubscribe = manager.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Update metrics periodically
    const updateMetrics = () => {
      const status = manager.getConnectionStatus();
      setConnectionMetrics({
        activeSubscriptions: status.activeSubscriptions.length,
        subscriptionCount: status.subscriptionCount,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const reconnect = useCallback(() => {
    const manager = getSubscriptionManager();
    if (manager) {
      manager.reconnect();
    }
  }, []);

  const disconnect = useCallback(() => {
    const manager = getSubscriptionManager();
    if (manager) {
      manager.disconnect();
    }
  }, []);

  return {
    isConnected,
    connectionMetrics,
    reconnect,
    disconnect,
    isAvailable: !!getSubscriptionManager(),
  };
}

/**
 * Combined hook for complete campaign real-time functionality
 */
export function useCampaignRealtime(campaignId: string | null) {
  const campaignUpdates = useCampaignRealtimeUpdates(campaignId);
  const commentsRealtime = useCampaignCommentsRealtime(campaignId);
  const votesRealtime = useCampaignVotesRealtime(campaignId);
  const connection = useRealtimeConnection();

  return {
    // Connection status
    isConnected: connection.isConnected,
    connectionMetrics: connection.connectionMetrics,
    reconnect: connection.reconnect,

    // Campaign updates
    campaignUpdate: campaignUpdates.lastUpdate,

    // Comments
    newComment: commentsRealtime.newComment,
    commentCount: commentsRealtime.commentCount,

    // Votes
    newVote: votesRealtime.newVote,
    voteCounts: votesRealtime.voteCounts,
    totalVotes: votesRealtime.totalVotes,

    // Subscription status
    subscriptionsActive: {
      campaign: campaignUpdates.subscriptionActive,
      comments: commentsRealtime.subscriptionActive,
      votes: votesRealtime.subscriptionActive,
    },
  };
}
