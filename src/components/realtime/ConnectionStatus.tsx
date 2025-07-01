'use client';

import { useState, useEffect } from 'react';
import { cn } from '~/lib/utils';
import {
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { getSubscriptionManager } from '~/lib/supabase-realtime';
import { Button } from '~/components/ui/button';

/**
 * Connection status display variants
 */
export type ConnectionStatusVariant = 'compact' | 'full' | 'tooltip';

/**
 * Props for ConnectionStatus component
 */
export interface ConnectionStatusProps {
  /**
   * Display variant
   * @default 'compact'
   */
  variant?: ConnectionStatusVariant;

  /**
   * Whether to show detailed metrics
   * @default false
   */
  showMetrics?: boolean;

  /**
   * Whether to auto-expand detailed view on error
   * @default true
   */
  expandOnError?: boolean;

  /**
   * Whether to show reconnect button
   * @default true
   */
  showReconnect?: boolean;

  /**
   * Whether to show copy details button
   * @default true
   */
  showCopyDetails?: boolean;

  /**
   * CSS class for the container
   */
  className?: string;

  /**
   * Metrics refresh interval in milliseconds
   * @default 5000
   */
  refreshInterval?: number;
}

/**
 * Real-time connection status component
 * Shows current connection state and provides reconnection controls
 */
export function ConnectionStatus({
  variant = 'compact',
  showMetrics = false,
  expandOnError = true,
  showReconnect = true,
  showCopyDetails = true,
  className,
  refreshInterval = 5000,
}: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionMetrics, setConnectionMetrics] = useState({
    activeSubscriptions: 0,
    subscriptionCount: 0,
    lastConnected: null as Date | null,
    lastDisconnected: null as Date | null,
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const manager = getSubscriptionManager();
    if (!manager) return;

    // Listen to connection changes
    const unsubscribe = manager.onConnectionChange((connected) => {
      setIsConnected(connected);
      setConnectionMetrics((prev) => ({
        ...prev,
        lastConnected: connected ? new Date() : prev.lastConnected,
        lastDisconnected: !connected ? new Date() : prev.lastDisconnected,
      }));

      // Auto-expand on error if enabled
      if (!connected && expandOnError) {
        setExpanded(true);
      }
    });

    // Refresh metrics periodically
    const metricsInterval = setInterval(() => {
      const status = manager.getConnectionStatus();
      setConnectionMetrics((prev) => ({
        ...prev,
        activeSubscriptions: status.activeSubscriptions.length,
        subscriptionCount: status.subscriptionCount,
      }));
    }, refreshInterval);

    // Initial status check
    const initialStatus = manager.getConnectionStatus();
    setIsConnected(initialStatus.isConnected);
    setConnectionMetrics((prev) => ({
      ...prev,
      activeSubscriptions: initialStatus.activeSubscriptions.length,
      subscriptionCount: initialStatus.subscriptionCount,
    }));

    return () => {
      unsubscribe();
      clearInterval(metricsInterval);
    };
  }, [expandOnError, refreshInterval]);

  const handleReconnect = async () => {
    const manager = getSubscriptionManager();
    if (!manager || isReconnecting) return;

    setIsReconnecting(true);
    try {
      manager.reconnect();
      // Give it a moment to attempt reconnection
      setTimeout(() => setIsReconnecting(false), 2000);
    } catch (error) {
      console.error('Failed to reconnect:', error);
      setIsReconnecting(false);
    }
  };

  const handleCopyDetails = () => {
    const details = {
      isConnected,
      connectionMetrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    navigator.clipboard
      ?.writeText(JSON.stringify(details, null, 2))
      .then(() => alert('Connection details copied to clipboard'))
      .catch(() => alert('Failed to copy connection details'));
  };

  // Tooltip variant - minimal indicator
  if (variant === 'tooltip') {
    return (
      <div className={cn('flex items-center rounded-full p-1', className)}>
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <div
              className={cn(
                'h-3 w-3 rounded-full transition-colors duration-300',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            {isReconnecting && (
              <RefreshCw className="absolute h-2 w-2 animate-spin text-gray-600" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant - status with text
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center space-x-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm border',
          isConnected ? 'border-green-200' : 'border-red-200',
          className
        )}
        onClick={() => variant === 'compact' && setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            {isReconnecting && (
              <RefreshCw className="absolute h-3 w-3 animate-spin text-gray-600" />
            )}
          </div>
          <span
            className={cn(
              'text-sm font-medium',
              isConnected ? 'text-green-700' : 'text-red-700'
            )}
          >
            {isReconnecting
              ? 'Reconnecting...'
              : isConnected
                ? 'Live'
                : 'Offline'}
          </span>
          {showMetrics && connectionMetrics.subscriptionCount > 0 && (
            <span className="text-xs text-gray-500">
              ({connectionMetrics.subscriptionCount})
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full variant - detailed status panel
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border bg-white/95 shadow-sm',
        isConnected ? 'border-green-200' : 'border-red-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              'flex items-center space-x-1.5',
              isConnected ? 'text-green-600' : 'text-red-600'
            )}
          >
            {isConnected ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="font-medium">
              {isReconnecting
                ? 'Reconnecting...'
                : isConnected
                  ? 'Connected'
                  : 'Disconnected'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {isConnected
              ? 'Real-time updates active'
              : 'Real-time updates unavailable'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {showReconnect && !isConnected && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                'Reconnect'
              )}
            </Button>
          )}

          {showCopyDetails && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyDetails}
              className="text-xs"
            >
              Copy Details
            </Button>
          )}
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && (
        <div className="p-3 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500">Active Subscriptions</span>
              <div className="font-medium">
                {connectionMetrics.subscriptionCount}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Status</span>
              <div
                className={cn(
                  'font-medium',
                  isConnected ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isConnected ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>

          {connectionMetrics.lastConnected && (
            <div>
              <span className="text-gray-500">Last Connected</span>
              <div className="font-medium text-xs">
                {connectionMetrics.lastConnected.toLocaleTimeString()}
              </div>
            </div>
          )}

          {connectionMetrics.lastDisconnected && !isConnected && (
            <div>
              <span className="text-gray-500">Last Disconnected</span>
              <div className="font-medium text-xs text-red-600">
                {connectionMetrics.lastDisconnected.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional info when expanded or on error */}
      {(expanded || (!isConnected && expandOnError)) && (
        <div className="border-t p-3 bg-gray-50 text-sm">
          {!isConnected ? (
            <div className="text-red-600">
              <p className="font-medium mb-1">Connection Lost</p>
              <p className="text-xs">
                Real-time features are temporarily unavailable.
                {showReconnect
                  ? ' Click reconnect to try again.'
                  : ' Please refresh the page.'}
              </p>
            </div>
          ) : (
            <div className="text-green-600">
              <p className="font-medium mb-1">Real-time Active</p>
              <p className="text-xs">
                You&apos;ll receive live updates for campaigns, comments, and
                votes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
