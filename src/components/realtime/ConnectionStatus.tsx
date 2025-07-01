import { useState } from 'react';
import { cn } from '~/lib/utils';
import { CheckCircle } from 'lucide-react';

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
 * Temporary placeholder component for connection status
 * TODO: Re-implement with proper real-time functionality
 */
export function ConnectionStatus({
  variant = 'compact',
  className,
}: ConnectionStatusProps) {
  const [isConnected] = useState(true); // Placeholder state

  if (variant === 'tooltip') {
    return (
      <div className={cn('flex items-center rounded-full p-1', className)}>
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center space-x-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm',
          className
        )}
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex items-center justify-center">
            <div
              className={cn(
                'h-3 w-3 rounded-full transition-colors duration-300',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
          </div>
          <span className="text-sm font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-lg border bg-white/95 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Connected</span>
          </div>
          <span className="text-xs text-gray-500">
            Real-time updates active
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm text-gray-600">
          Real-time connection status will be implemented here.
        </div>
      </div>
    </div>
  );
}
