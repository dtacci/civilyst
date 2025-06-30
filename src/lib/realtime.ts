/**
 * Supabase Realtime integration for live updates
 * This module provides utilities for working with Supabase Realtime WebSocket connections
 * for campaigns, participants, and notifications.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { env } from '~/env';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '~/components/ui/use-toast';

// ---------------------------------------------------------------------------
// Types and Interfaces
// ---------------------------------------------------------------------------

/**
 * Connection status for real-time WebSocket
 */
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Event types for real-time updates
 */
export enum RealtimeEventType {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Tables that support real-time updates
 */
export enum RealtimeTable {
  CAMPAIGNS = 'campaigns',
  CAMPAIGN_PARTICIPANTS = 'campaign_participants',
  VOTES = 'votes',
  COMMENTS = 'comments',
  NOTIFICATIONS = 'notifications',
}

/**
 * Filter configuration for real-time subscriptions
 */
export interface RealtimeFilter {
  event?: RealtimeEventType | RealtimeEventType[];
  schema?: string;
  table?: string;
  filter?: string;
  columns?: string[];
}

/**
 * Configuration for real-time subscriptions
 */
export interface RealtimeConfig {
  /**
   * Channel name for the subscription
   * Should be unique per component instance
   */
  channelName: string;

  /**
   * Tables to subscribe to
   */
  tables: RealtimeTable[];

  /**
   * Filters for each table
   * Key is the table name, value is the filter
   */
  filters?: Record<RealtimeTable, RealtimeFilter>;

  /**
   * Whether to enable heartbeat for connection monitoring
   * @default true
   */
  enableHeartbeat?: boolean;

  /**
   * Heartbeat interval in milliseconds
   * @default 30000 (30 seconds)
   */
  heartbeatIntervalMs?: number;

  /**
   * Maximum number of reconnection attempts
   * @default 5
   */
  maxReconnectAttempts?: number;

  /**
   * Base delay for exponential backoff in milliseconds
   * @default 1000 (1 second)
   */
  reconnectBaseDelayMs?: number;

  /**
   * Maximum delay for exponential backoff in milliseconds
   * @default 30000 (30 seconds)
   */
  reconnectMaxDelayMs?: number;

  /**
   * Rate limit for events in events per second
   * @default 10
   */
  rateLimit?: number;

  /**
   * Whether to deduplicate events by ID
   * @default true
   */
  deduplicateEvents?: boolean;

  /**
   * Callback when connection status changes
   */
  onStatusChange?: (status: ConnectionStatus) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Campaign real-time event payload
 */
export interface CampaignRealtimeEvent {
  id: string;
  title: string;
  description: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  creatorId: string;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Campaign participant real-time event payload
 */
export interface ParticipantRealtimeEvent {
  id: string;
  campaignId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

/**
 * Vote real-time event payload
 */
export interface VoteRealtimeEvent {
  id: string;
  campaignId: string;
  userId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Comment real-time event payload
 */
export interface CommentRealtimeEvent {
  id: string;
  campaignId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Notification real-time event payload
 */
export interface NotificationRealtimeEvent {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown>;
  createdAt: string;
}

/**
 * Combined real-time event payload
 */
export type RealtimeEvent =
  | CampaignRealtimeEvent
  | ParticipantRealtimeEvent
  | VoteRealtimeEvent
  | CommentRealtimeEvent
  | NotificationRealtimeEvent;

/**
 * Real-time subscription options
 */
export interface RealtimeSubscriptionOptions<T> {
  /**
   * Callback when an event is received
   */
  onEvent: (payload: RealtimePostgresChangesPayload<T>) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Filter for the subscription
   */
  filter?: RealtimeFilter;
}

/**
 * Real-time metrics for monitoring
 */
export interface RealtimeMetrics {
  /**
   * Total number of events received
   */
  totalEvents: number;

  /**
   * Number of events by type
   */
  eventsByType: Record<RealtimeEventType, number>;

  /**
   * Number of events by table
   */
  eventsByTable: Record<RealtimeTable, number>;

  /**
   * Number of reconnection attempts
   */
  reconnectAttempts: number;

  /**
   * Number of successful reconnections
   */
  successfulReconnects: number;

  /**
   * Number of rate-limited events
   */
  rateLimitedEvents: number;

  /**
   * Number of deduplicated events
   */
  deduplicatedEvents: number;

  /**
   * Average event processing time in milliseconds
   */
  avgProcessingTimeMs: number;

  /**
   * Last heartbeat timestamp
   */
  lastHeartbeat: Date | null;

  /**
   * Connection uptime in milliseconds
   */
  uptimeMs: number;

  /**
   * Connection established timestamp
   */
  connectedSince: Date | null;
}

// ---------------------------------------------------------------------------
// Supabase Realtime Client
// ---------------------------------------------------------------------------

/**
 * Create a Supabase client for real-time subscriptions
 * This uses the anonymous key as real-time auth is handled separately
 */
export function createRealtimeClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL and anon key are required for real-time client'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

// Global client instance for reuse
let realtimeClient: ReturnType<typeof createRealtimeClient> | null = null;

/**
 * Get the Supabase real-time client, creating it if necessary
 */
export function getRealtimeClient() {
  if (!realtimeClient) {
    realtimeClient = createRealtimeClient();
  }
  return realtimeClient;
}

// ---------------------------------------------------------------------------
// Connection Management
// ---------------------------------------------------------------------------

/**
 * Global connection status and metrics
 */
const globalConnectionStatus = {
  status: ConnectionStatus.DISCONNECTED,
  metrics: initializeMetrics(),
  listeners: new Set<(status: ConnectionStatus) => void>(),
  errors: new Set<(error: Error) => void>(),
};

/**
 * Initialize metrics object
 */
function initializeMetrics(): RealtimeMetrics {
  return {
    totalEvents: 0,
    eventsByType: {
      [RealtimeEventType.INSERT]: 0,
      [RealtimeEventType.UPDATE]: 0,
      [RealtimeEventType.DELETE]: 0,
    },
    eventsByTable: {
      [RealtimeTable.CAMPAIGNS]: 0,
      [RealtimeTable.CAMPAIGN_PARTICIPANTS]: 0,
      [RealtimeTable.VOTES]: 0,
      [RealtimeTable.COMMENTS]: 0,
      [RealtimeTable.NOTIFICATIONS]: 0,
    },
    reconnectAttempts: 0,
    successfulReconnects: 0,
    rateLimitedEvents: 0,
    deduplicatedEvents: 0,
    avgProcessingTimeMs: 0,
    lastHeartbeat: null,
    uptimeMs: 0,
    connectedSince: null,
  };
}

/**
 * Update connection status and notify listeners
 */
function updateConnectionStatus(status: ConnectionStatus, error?: Error) {
  globalConnectionStatus.status = status;

  // Update metrics
  if (status === ConnectionStatus.CONNECTED) {
    globalConnectionStatus.metrics.connectedSince = new Date();
  } else if (status === ConnectionStatus.RECONNECTING) {
    globalConnectionStatus.metrics.reconnectAttempts += 1;
  }

  // Notify listeners
  globalConnectionStatus.listeners.forEach((listener) => {
    try {
      listener(status);
    } catch (listenerError) {
      console.error('Error in connection status listener:', listenerError);
    }
  });

  // Notify error listeners
  if (error && status === ConnectionStatus.ERROR) {
    globalConnectionStatus.errors.forEach((listener) => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in connection error listener:', listenerError);
      }
    });
  }
}

/**
 * Add connection status listener
 */
export function addConnectionStatusListener(
  listener: (status: ConnectionStatus) => void
) {
  globalConnectionStatus.listeners.add(listener);
  return () => {
    globalConnectionStatus.listeners.delete(listener);
  };
}

/**
 * Add connection error listener
 */
export function addConnectionErrorListener(listener: (error: Error) => void) {
  globalConnectionStatus.errors.add(listener);
  return () => {
    globalConnectionStatus.errors.delete(listener);
  };
}

/**
 * Get current connection status
 */
export function getConnectionStatus() {
  return globalConnectionStatus.status;
}

/**
 * Get real-time metrics
 */
export function getRealtimeMetrics(): RealtimeMetrics {
  // Calculate uptime if connected
  if (
    globalConnectionStatus.status === ConnectionStatus.CONNECTED &&
    globalConnectionStatus.metrics.connectedSince
  ) {
    globalConnectionStatus.metrics.uptimeMs =
      Date.now() - globalConnectionStatus.metrics.connectedSince.getTime();
  }

  return { ...globalConnectionStatus.metrics };
}

/**
 * Reset real-time metrics
 */
export function resetRealtimeMetrics() {
  globalConnectionStatus.metrics = initializeMetrics();
}

// ---------------------------------------------------------------------------
// Subscription Management
// ---------------------------------------------------------------------------

/**
 * Active subscriptions registry to prevent duplicates and manage cleanup
 */
const activeSubscriptions = new Map<string, RealtimeChannel>();

/**
 * Event deduplication cache
 */
const eventCache = new Map<string, number>();

/**
 * Rate limiting state
 */
const rateLimiter = {
  events: 0,
  lastReset: Date.now(),
  interval: 1000, // 1 second
};

/**
 * Create a unique subscription key
 */
function createSubscriptionKey(channelName: string, table: RealtimeTable) {
  return `${channelName}:${table}`;
}

/**
 * Create a unique event key for deduplication
 */
function createEventKey(table: string, event: RealtimeEventType, id: string) {
  return `${table}:${event}:${id}`;
}

/**
 * Check if an event should be rate limited
 */
function shouldRateLimit(rateLimit: number): boolean {
  const now = Date.now();

  // Reset counter if interval has passed
  if (now - rateLimiter.lastReset > rateLimiter.interval) {
    rateLimiter.events = 0;
    rateLimiter.lastReset = now;
  }

  // Check if rate limit is exceeded
  if (rateLimiter.events >= rateLimit) {
    globalConnectionStatus.metrics.rateLimitedEvents += 1;
    return true;
  }

  // Increment event counter
  rateLimiter.events += 1;
  return false;
}

/**
 * Check if an event is a duplicate
 */
function isDuplicate(
  table: string,
  event: RealtimeEventType,
  id: string
): boolean {
  const key = createEventKey(table, event, id);
  const now = Date.now();

  // Check if event exists in cache and is recent (within 2 seconds)
  const lastSeen = eventCache.get(key);
  if (lastSeen && now - lastSeen < 2000) {
    globalConnectionStatus.metrics.deduplicatedEvents += 1;
    return true;
  }

  // Add event to cache
  eventCache.set(key, now);

  // Clean up old events (older than 10 seconds)
  if (eventCache.size > 1000) {
    for (const [cacheKey, timestamp] of eventCache.entries()) {
      if (now - timestamp > 10000) {
        eventCache.delete(cacheKey);
      }
    }
  }

  return false;
}

/**
 * Update metrics for an event
 */
function updateEventMetrics(
  table: RealtimeTable,
  event: RealtimeEventType,
  processingTimeMs: number
) {
  globalConnectionStatus.metrics.totalEvents += 1;
  globalConnectionStatus.metrics.eventsByType[event] += 1;
  globalConnectionStatus.metrics.eventsByTable[table] += 1;

  // Update average processing time
  const totalEvents = globalConnectionStatus.metrics.totalEvents;
  globalConnectionStatus.metrics.avgProcessingTimeMs =
    (globalConnectionStatus.metrics.avgProcessingTimeMs * (totalEvents - 1) +
      processingTimeMs) /
    totalEvents;
}

/**
 * Subscribe to real-time updates for a specific table
 */
export function subscribeToTable<T extends RealtimeEvent>(
  channelName: string,
  table: RealtimeTable,
  options: RealtimeSubscriptionOptions<T>
): () => void {
  const supabase = getRealtimeClient();
  const key = createSubscriptionKey(channelName, table);

  // Check if subscription already exists
  if (activeSubscriptions.has(key)) {
    console.warn(`Subscription already exists for ${key}`);
    return () => {}; // Return empty cleanup function
  }

  // Create channel
  const channel = supabase
    .channel(key)
    .on(
      'postgres_changes',
      {
        event: options.filter?.event || '*',
        schema: options.filter?.schema || 'public',
        table: table,
        filter: options.filter?.filter,
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        const startTime = performance.now();

        try {
          // Get ID from new or old record for deduplication
          const id = (payload.new?.id || payload.old?.id) as string;

          // Skip if rate limited
          if (shouldRateLimit(10)) {
            return;
          }

          // Skip if duplicate
          if (
            id &&
            isDuplicate(table, payload.eventType as RealtimeEventType, id)
          ) {
            return;
          }

          // Update metrics
          updateEventMetrics(
            table,
            payload.eventType as RealtimeEventType,
            performance.now() - startTime
          );

          // Call event handler
          options.onEvent(payload);
        } catch (error) {
          console.error(`Error processing ${table} event:`, error);
          options.onError?.(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        updateConnectionStatus(ConnectionStatus.CONNECTED);
      } else if (status === 'CHANNEL_ERROR') {
        updateConnectionStatus(
          ConnectionStatus.ERROR,
          err || new Error(`Channel error for ${key}`)
        );
        options.onError?.(err || new Error(`Channel error for ${key}`));
      } else if (status === 'TIMED_OUT') {
        updateConnectionStatus(ConnectionStatus.RECONNECTING);
        // Reconnection is handled by Supabase client
      }
    });

  // Store subscription for cleanup
  activeSubscriptions.set(key, channel);

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
    activeSubscriptions.delete(key);
  };
}

/**
 * Subscribe to multiple tables
 */
export function subscribeToTables<T extends RealtimeEvent>(
  channelName: string,
  tables: RealtimeTable[],
  options: Record<RealtimeTable, RealtimeSubscriptionOptions<T>>
): () => void {
  // Create subscriptions for each table
  const cleanupFunctions = tables.map((table) => {
    return subscribeToTable(channelName, table, options[table]);
  });

  // Return combined cleanup function
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}

/**
 * Unsubscribe from all channels for a component
 */
export function unsubscribeAll(channelName: string) {
  const supabase = getRealtimeClient();

  // Find all subscriptions for this channel name
  for (const [key, channel] of activeSubscriptions.entries()) {
    if (key.startsWith(`${channelName}:`)) {
      supabase.removeChannel(channel);
      activeSubscriptions.delete(key);
    }
  }
}

/**
 * Setup heartbeat for connection monitoring
 */
export function setupHeartbeat(intervalMs = 30000): () => void {
  const supabase = getRealtimeClient();
  const channel = supabase.channel('heartbeat');

  // Setup heartbeat interval
  const interval = setInterval(() => {
    if (channel) {
      // Send ping
      channel.send({
        type: 'broadcast',
        event: 'heartbeat',
        payload: { timestamp: Date.now() },
      });

      // Update metrics
      globalConnectionStatus.metrics.lastHeartbeat = new Date();
    }
  }, intervalMs);

  // Subscribe to channel
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      globalConnectionStatus.metrics.lastHeartbeat = new Date();
    }
  });

  // Return cleanup function
  return () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// Reconnection Logic
// ---------------------------------------------------------------------------

/**
 * Setup automatic reconnection with exponential backoff
 */
export function setupReconnection(
  baseDelayMs = 1000,
  maxDelayMs = 30000,
  maxAttempts = 5
): () => void {
  let attempts = 0;
  let timeout: NodeJS.Timeout | null = null;

  // Function to attempt reconnection
  const attemptReconnect = () => {
    if (attempts >= maxAttempts) {
      updateConnectionStatus(
        ConnectionStatus.ERROR,
        new Error(`Failed to reconnect after ${maxAttempts} attempts`)
      );
      return;
    }

    // Calculate delay with exponential backoff and jitter
    const delay = Math.min(
      baseDelayMs * Math.pow(2, attempts) + Math.random() * 1000,
      maxDelayMs
    );
    attempts++;

    updateConnectionStatus(ConnectionStatus.RECONNECTING);

    // Try to reconnect
    timeout = setTimeout(() => {
      try {
        // Close all existing channels
        const supabase = getRealtimeClient();
        activeSubscriptions.forEach((channel) => {
          supabase.removeChannel(channel);
        });
        activeSubscriptions.clear();

        // Force reconnection by recreating client
        realtimeClient = createRealtimeClient();

        // Update metrics
        globalConnectionStatus.metrics.successfulReconnects += 1;

        // Reset attempts on success
        attempts = 0;

        // Update status
        updateConnectionStatus(ConnectionStatus.CONNECTED);
      } catch (error) {
        console.error('Reconnection attempt failed:', error);

        // Try again with increased delay
        attemptReconnect();
      }
    }, delay);
  };

  // Listen for disconnection
  const removeListener = addConnectionStatusListener((status) => {
    if (status === ConnectionStatus.DISCONNECTED) {
      attemptReconnect();
    }
  });

  // Return cleanup function
  return () => {
    removeListener();
    if (timeout) {
      clearTimeout(timeout);
    }
  };
}

// ---------------------------------------------------------------------------
// React Hooks
// ---------------------------------------------------------------------------

/**
 * Hook to use connection status
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus());

  useEffect(() => {
    const removeListener = addConnectionStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    return removeListener;
  }, []);

  return status;
}

/**
 * Hook to use real-time metrics
 */
export function useRealtimeMetrics(refreshIntervalMs = 5000) {
  const [metrics, setMetrics] = useState<RealtimeMetrics>(getRealtimeMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getRealtimeMetrics());
    }, refreshIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [refreshIntervalMs]);

  return metrics;
}

/**
 * Hook to subscribe to real-time updates for campaigns
 */
export function useRealtimeCampaign<T extends CampaignRealtimeEvent>(
  campaignId: string,
  options: {
    onInsert?: (campaign: T) => void;
    onUpdate?: (campaign: T) => void;
    onDelete?: (campaign: T) => void;
    enabled?: boolean;
  } = {}
) {
  const { enabled = true } = options;
  const { userId } = useAuth();
  const { toast } = useToast();
  const channelNameRef = useRef(
    `campaign:${campaignId}:${userId || 'anonymous'}`
  );

  // Track loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to campaign updates
  useEffect(() => {
    if (!enabled || !campaignId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cleanup = subscribeToTable<T>(
      channelNameRef.current,
      RealtimeTable.CAMPAIGNS,
      {
        onEvent: (payload) => {
          setIsLoading(false);

          // Handle different event types
          if (
            payload.eventType === 'INSERT' &&
            options.onInsert &&
            payload.new
          ) {
            options.onInsert(payload.new);
          } else if (
            payload.eventType === 'UPDATE' &&
            options.onUpdate &&
            payload.new
          ) {
            options.onUpdate(payload.new);
          } else if (
            payload.eventType === 'DELETE' &&
            options.onDelete &&
            payload.old
          ) {
            options.onDelete(payload.old as T);
          }
        },
        onError: (err) => {
          setError(err);
          setIsLoading(false);

          // Show toast notification for errors
          toast({
            title: 'Real-time Error',
            description: `Failed to receive campaign updates: ${err.message}`,
            variant: 'destructive',
          });
        },
        filter: {
          event: '*',
          filter: `id=eq.${campaignId}`,
        },
      }
    );

    return cleanup;
  }, [
    campaignId,
    enabled,
    options, // include full options for stability
    options.onDelete,
    options.onInsert,
    options.onUpdate,
    toast,
    userId,
  ]);

  return { isLoading, error };
}

/**
 * Hook to subscribe to real-time updates for campaign participants
 */
export function useRealtimeParticipants<T extends ParticipantRealtimeEvent>(
  campaignId: string,
  options: {
    onInsert?: (participant: T) => void;
    onUpdate?: (participant: T) => void;
    onDelete?: (participant: T) => void;
    enabled?: boolean;
  } = {}
) {
  const { enabled = true } = options;
  const { userId } = useAuth();
  const { toast } = useToast();
  const channelNameRef = useRef(
    `participants:${campaignId}:${userId || 'anonymous'}`
  );

  // Track loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to participant updates
  useEffect(() => {
    if (!enabled || !campaignId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cleanup = subscribeToTable<T>(
      channelNameRef.current,
      RealtimeTable.CAMPAIGN_PARTICIPANTS,
      {
        onEvent: (payload) => {
          setIsLoading(false);

          // Handle different event types
          if (
            payload.eventType === 'INSERT' &&
            options.onInsert &&
            payload.new
          ) {
            options.onInsert(payload.new);
          } else if (
            payload.eventType === 'UPDATE' &&
            options.onUpdate &&
            payload.new
          ) {
            options.onUpdate(payload.new);
          } else if (
            payload.eventType === 'DELETE' &&
            options.onDelete &&
            payload.old
          ) {
            options.onDelete(payload.old as T);
          }
        },
        onError: (err) => {
          setError(err);
          setIsLoading(false);

          // Show toast notification for errors
          toast({
            title: 'Real-time Error',
            description: `Failed to receive participant updates: ${err.message}`,
            variant: 'destructive',
          });
        },
        filter: {
          event: '*',
          filter: `campaign_id=eq.${campaignId}`,
        },
      }
    );

    return cleanup;
  }, [
    campaignId,
    enabled,
    options,
    options.onDelete,
    options.onInsert,
    options.onUpdate,
    toast,
    userId,
  ]);

  return { isLoading, error };
}

/**
 * Hook to subscribe to real-time updates for notifications
 */
export function useRealtimeNotifications<T extends NotificationRealtimeEvent>(
  options: {
    onInsert?: (notification: T) => void;
    onUpdate?: (notification: T) => void;
    onDelete?: (notification: T) => void;
    enabled?: boolean;
  } = {}
) {
  const { enabled = true } = options;
  const { userId } = useAuth();
  const { toast } = useToast();
  const channelNameRef = useRef(`notifications:${userId || 'anonymous'}`);

  // Track loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to notification updates
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cleanup = subscribeToTable<T>(
      channelNameRef.current,
      RealtimeTable.NOTIFICATIONS,
      {
        onEvent: (payload) => {
          setIsLoading(false);

          // Handle different event types
          if (
            payload.eventType === 'INSERT' &&
            options.onInsert &&
            payload.new
          ) {
            options.onInsert(payload.new);
          } else if (
            payload.eventType === 'UPDATE' &&
            options.onUpdate &&
            payload.new
          ) {
            options.onUpdate(payload.new);
          } else if (
            payload.eventType === 'DELETE' &&
            options.onDelete &&
            payload.old
          ) {
            options.onDelete(payload.old as T);
          }
        },
        onError: (err) => {
          setError(err);
          setIsLoading(false);

          // Show toast notification for errors
          toast({
            title: 'Real-time Error',
            description: `Failed to receive notification updates: ${err.message}`,
            variant: 'destructive',
          });
        },
        filter: {
          event: '*',
          filter: `user_id=eq.${userId}`,
        },
      }
    );

    return cleanup;
  }, [
    enabled,
    options,
    options.onDelete,
    options.onInsert,
    options.onUpdate,
    toast,
    userId,
  ]);

  return { isLoading, error };
}

/**
 * Hook to setup real-time connection with automatic reconnection and heartbeat
 */
export function useRealtimeConnection(
  options: {
    enabled?: boolean;
    heartbeatInterval?: number;
    reconnectBaseDelay?: number;
    reconnectMaxDelay?: number;
    maxReconnectAttempts?: number;
    onStatusChange?: (status: ConnectionStatus) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    enabled = true,
    heartbeatInterval = 30000,
    reconnectBaseDelay = 1000,
    reconnectMaxDelay = 30000,
    maxReconnectAttempts = 5,
    onStatusChange,
    onError,
  } = options;

  const status = useConnectionStatus();

  // Setup connection listeners
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Add status change listener
    const statusCleanup = onStatusChange
      ? addConnectionStatusListener(onStatusChange)
      : () => {};

    // Add error listener
    const errorCleanup = onError
      ? addConnectionErrorListener(onError)
      : () => {};

    // Setup heartbeat
    const heartbeatCleanup = setupHeartbeat(heartbeatInterval);

    // Setup reconnection
    const reconnectCleanup = setupReconnection(
      reconnectBaseDelay,
      reconnectMaxDelay,
      maxReconnectAttempts
    );

    return () => {
      statusCleanup();
      errorCleanup();
      heartbeatCleanup();
      reconnectCleanup();
    };
  }, [
    enabled,
    heartbeatInterval,
    maxReconnectAttempts,
    onError,
    onStatusChange,
    reconnectBaseDelay,
    reconnectMaxDelay,
  ]);

  return { status };
}

/**
 * Hook to create a component-scoped real-time subscription manager
 */
export function useRealtimeManager(componentId: string) {
  const cleanupRef = useRef<Array<() => void>>([]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      // Call all cleanup functions
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];

      // Unsubscribe from all channels for this component
      unsubscribeAll(componentId);
    };
    // include top-level unsubscribeAll reference for clarity
  }, [componentId, unsubscribeAll]);

  // Subscribe to a table
  const subscribe = useCallback(
    <T extends RealtimeEvent>(
      table: RealtimeTable,
      options: RealtimeSubscriptionOptions<T>
    ) => {
      const cleanup = subscribeToTable<T>(componentId, table, options);
      cleanupRef.current.push(cleanup);
      return cleanup;
    },
    [componentId]
  );

  // Subscribe to multiple tables
  const subscribeMultiple = useCallback(
    <T extends RealtimeEvent>(
      tables: RealtimeTable[],
      options: Record<RealtimeTable, RealtimeSubscriptionOptions<T>>
    ) => {
      const cleanup = subscribeToTables<T>(componentId, tables, options);
      cleanupRef.current.push(cleanup);
      return cleanup;
    },
    [componentId]
  );

  // Unsubscribe from all
  const unsubscribeAll = useCallback(() => {
    cleanupRef.current.forEach((cleanup) => cleanup());
    cleanupRef.current = [];
  }, []);

  return {
    subscribe,
    subscribeMultiple,
    unsubscribeAll,
  };
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the real-time system
 * Call this once during app initialization
 */
export function initializeRealtime() {
  // Get client to ensure it's created
  getRealtimeClient();

  // Setup heartbeat
  setupHeartbeat();

  // Setup reconnection logic
  setupReconnection();

  // Set initial connection status
  updateConnectionStatus(ConnectionStatus.CONNECTING);

  return {
    getConnectionStatus,
    getRealtimeMetrics,
    resetRealtimeMetrics,
  };
}
