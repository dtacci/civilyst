import { useState, useEffect, useCallback } from 'react';
import {
  useConnectionStatus,
  useRealtimeMetrics,
  ConnectionStatus,
  getRealtimeClient,
} from '~/lib/realtime';
import { cn } from '~/lib/utils';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { useToast } from '~/components/ui/use-toast';

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
 * Format milliseconds to a human-readable duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format date to a human-readable time
 */
function formatTime(date: Date | null): string {
  if (!date) return 'Never';

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Component to display real-time connection status
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
  const status = useConnectionStatus();
  const metrics = useRealtimeMetrics(refreshInterval);
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  // Auto-expand on error if configured
  useEffect(() => {
    if (
      expandOnError &&
      (status === ConnectionStatus.ERROR ||
        status === ConnectionStatus.DISCONNECTED)
    ) {
      setExpanded(true);
    }
  }, [expandOnError, status]);

  // Get status color and icon
  const getStatusInfo = useCallback(() => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return {
          color: 'bg-green-500',
          pulseColor: 'bg-green-400',
          textColor: 'text-green-600',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Connected',
          pulse: false,
        };
      case ConnectionStatus.CONNECTING:
        return {
          color: 'bg-yellow-500',
          pulseColor: 'bg-yellow-400',
          textColor: 'text-yellow-600',
          icon: <Wifi className="h-4 w-4" />,
          label: 'Connecting',
          pulse: true,
        };
      case ConnectionStatus.RECONNECTING:
        return {
          color: 'bg-orange-500',
          pulseColor: 'bg-orange-400',
          textColor: 'text-orange-600',
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          label: 'Reconnecting',
          pulse: true,
        };
      case ConnectionStatus.DISCONNECTED:
        return {
          color: 'bg-red-500',
          pulseColor: 'bg-red-400',
          textColor: 'text-red-600',
          icon: <WifiOff className="h-4 w-4" />,
          label: 'Disconnected',
          pulse: false,
        };
      case ConnectionStatus.ERROR:
        return {
          color: 'bg-red-600',
          pulseColor: 'bg-red-500',
          textColor: 'text-red-700',
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Error',
          pulse: false,
        };
      default:
        return {
          color: 'bg-gray-500',
          pulseColor: 'bg-gray-400',
          textColor: 'text-gray-600',
          icon: <Clock className="h-4 w-4" />,
          label: 'Unknown',
          pulse: false,
        };
    }
  }, [status]);

  // Handle manual reconnect
  const handleReconnect = useCallback(() => {
    try {
      // Get client and recreate connection
      const client = getRealtimeClient();

      // Force reconnection by disconnecting and reconnecting
      client.removeAllChannels();

      toast({
        title: 'Reconnecting',
        description: 'Attempting to reconnect to real-time updates...',
      });
    } catch (error) {
      console.error('Failed to reconnect:', error);
      toast({
        title: 'Reconnection Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Copy connection details to clipboard
  const copyDetails = useCallback(() => {
    const details = {
      status,
      lastHeartbeat: metrics.lastHeartbeat
        ? metrics.lastHeartbeat.toISOString()
        : null,
      connectedSince: metrics.connectedSince
        ? metrics.connectedSince.toISOString()
        : null,
      uptime: metrics.uptimeMs,
      totalEvents: metrics.totalEvents,
      eventsByType: metrics.eventsByType,
      eventsByTable: metrics.eventsByTable,
      reconnectAttempts: metrics.reconnectAttempts,
      successfulReconnects: metrics.successfulReconnects,
      avgProcessingTimeMs: metrics.avgProcessingTimeMs,
    };

    navigator.clipboard.writeText(JSON.stringify(details, null, 2));

    toast({
      title: 'Copied',
      description: 'Connection details copied to clipboard',
    });
  }, [metrics, status, toast]);

  // Render status indicator
  const renderStatusIndicator = () => {
    const { color, pulseColor, label, pulse } = getStatusInfo();

    return (
      <div className="flex items-center space-x-2">
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              'h-3 w-3 rounded-full transition-colors duration-300',
              color
            )}
          />
          {pulse && (
            <div
              className={cn(
                'absolute inset-0 h-3 w-3 rounded-full opacity-75',
                pulseColor,
                'animate-ping'
              )}
            />
          )}
        </div>
        {variant !== 'tooltip' && (
          <span className="text-sm font-medium">{label}</span>
        )}
      </div>
    );
  };

  // Render compact view
  if (variant === 'compact' && !expanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex cursor-pointer items-center space-x-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm hover:bg-white/95',
                className
              )}
              onClick={() => setExpanded(true)}
            >
              {renderStatusIndicator()}
              {showReconnect &&
                (status === ConnectionStatus.DISCONNECTED ||
                  status === ConnectionStatus.ERROR) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReconnect();
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="space-y-1 p-1 text-xs">
              <div className="font-medium">Real-time Connection</div>
              <div>Status: {getStatusInfo().label}</div>
              {metrics.lastHeartbeat && (
                <div>Last update: {formatTime(metrics.lastHeartbeat)}</div>
              )}
              {metrics.connectedSince && (
                <div>Connected for: {formatDuration(metrics.uptimeMs)}</div>
              )}
              <div>Events: {metrics.totalEvents}</div>
              <div className="pt-1 text-[10px] opacity-70">Click to expand</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Render tooltip-only view
  if (variant === 'tooltip' && !expanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex cursor-pointer items-center rounded-full p-1',
                className
              )}
              onClick={() => setExpanded(true)}
            >
              {renderStatusIndicator()}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="space-y-1 p-1 text-xs">
              <div className="font-medium">Real-time Connection</div>
              <div>Status: {getStatusInfo().label}</div>
              {metrics.lastHeartbeat && (
                <div>Last update: {formatTime(metrics.lastHeartbeat)}</div>
              )}
              {metrics.connectedSince && (
                <div>Connected for: {formatDuration(metrics.uptimeMs)}</div>
              )}
              <div>Events: {metrics.totalEvents}</div>
              <div className="pt-1 text-[10px] opacity-70">Click to expand</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Render expanded or full view
  const { textColor, icon } = getStatusInfo();

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border bg-white/95 shadow-sm transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center space-x-2">
          <div className={cn('flex items-center space-x-1.5', textColor)}>
            {icon}
            <span className="font-medium">{getStatusInfo().label}</span>
          </div>
          <span className="text-xs text-gray-500">
            {metrics.lastHeartbeat
              ? `Last update: ${formatTime(metrics.lastHeartbeat)}`
              : 'No updates yet'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {showReconnect &&
            (status === ConnectionStatus.DISCONNECTED ||
              status === ConnectionStatus.ERROR) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={handleReconnect}
                title="Reconnect"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          {showCopyDetails && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={copyDetails}
              title="Copy connection details"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {variant !== 'full' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setExpanded(false)}
              title="Collapse"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Basic Stats */}
      <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
        <div className="rounded-md bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Connection Time</div>
          <div className="font-medium">
            {metrics.connectedSince
              ? formatDuration(metrics.uptimeMs)
              : 'Not connected'}
          </div>
        </div>
        <div className="rounded-md bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Total Events</div>
          <div className="font-medium">{metrics.totalEvents}</div>
        </div>
        <div className="rounded-md bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Reconnect Attempts</div>
          <div className="font-medium">{metrics.reconnectAttempts}</div>
        </div>
        <div className="rounded-md bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Avg Processing</div>
          <div className="font-medium">
            {metrics.avgProcessingTimeMs.toFixed(1)}ms
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      {showMetrics && (
        <div className="border-t p-3">
          <div className="mb-2 text-sm font-medium">Detailed Metrics</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Events by Type */}
            <div className="rounded-md bg-gray-50 p-2">
              <div className="mb-1 text-xs font-medium text-gray-500">
                Events by Type
              </div>
              <div className="space-y-1 text-xs">
                {Object.entries(metrics.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span>{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Events by Table */}
            <div className="rounded-md bg-gray-50 p-2">
              <div className="mb-1 text-xs font-medium text-gray-500">
                Events by Table
              </div>
              <div className="space-y-1 text-xs">
                {Object.entries(metrics.eventsByTable).map(([table, count]) => (
                  <div key={table} className="flex justify-between">
                    <span>{table}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Stats */}
            <div className="rounded-md bg-gray-50 p-2">
              <div className="mb-1 text-xs font-medium text-gray-500">
                Additional Stats
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Rate Limited Events</span>
                  <span className="font-medium">
                    {metrics.rateLimitedEvents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Deduplicated Events</span>
                  <span className="font-medium">
                    {metrics.deduplicatedEvents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Successful Reconnects</span>
                  <span className="font-medium">
                    {metrics.successfulReconnects}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Timeline */}
            <div className="rounded-md bg-gray-50 p-2">
              <div className="mb-1 text-xs font-medium text-gray-500">
                Connection Timeline
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Connected Since</span>
                  <span className="font-medium">
                    {metrics.connectedSince
                      ? formatTime(metrics.connectedSince)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Heartbeat</span>
                  <span className="font-medium">
                    {metrics.lastHeartbeat
                      ? formatTime(metrics.lastHeartbeat)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer with toggle for detailed metrics */}
      <div className="flex items-center justify-between border-t p-2">
        <span className="text-xs text-gray-500">
          {status === ConnectionStatus.CONNECTED
            ? 'Real-time updates active'
            : 'Real-time updates inactive'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setExpanded(!showMetrics)}
        >
          {showMetrics ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Show Details
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
