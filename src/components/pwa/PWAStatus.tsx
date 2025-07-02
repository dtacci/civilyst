'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Sync, Database, Bell } from 'lucide-react';
import { pwaManager, type PWACapabilities } from '~/lib/pwa-enhanced';
import { cn } from '~/lib/utils';

interface PWAStatusProps {
  className?: string;
  variant?: 'compact' | 'detailed';
}

export function PWAStatus({ className, variant = 'compact' }: PWAStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(null);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;

    // Set initial online status
    setIsOnline(navigator.onLine);

    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get PWA capabilities
    const caps = pwaManager.getPWACapabilities();
    setCapabilities(caps);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!capabilities) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center space-x-2 text-sm', className)}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-600" />
        )}
        <span className={isOnline ? 'text-green-700' : 'text-orange-700'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {syncQueueCount > 0 && (
          <>
            <Sync className="h-3 w-3 text-blue-600" />
            <span className="text-blue-700 text-xs">{syncQueueCount}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 p-4 border rounded-lg bg-card', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">PWA Status</h3>
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-600" />
          )}
          <span className={cn('text-sm', isOnline ? 'text-green-700' : 'text-orange-700')}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Download className={cn('h-4 w-4', capabilities.serviceWorker ? 'text-green-600' : 'text-gray-400')} />
          <span>Service Worker</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Sync className={cn('h-4 w-4', capabilities.backgroundSync ? 'text-green-600' : 'text-gray-400')} />
          <span>Background Sync</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Database className={cn('h-4 w-4', capabilities.persistentStorage ? 'text-green-600' : 'text-gray-400')} />
          <span>Persistent Storage</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Bell className={cn('h-4 w-4', capabilities.notifications ? 'text-green-600' : 'text-gray-400')} />
          <span>Notifications</span>
        </div>
      </div>

      {syncQueueCount > 0 && (
        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center space-x-2">
            <Sync className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {syncQueueCount} item{syncQueueCount > 1 ? 's' : ''} queued for sync
            </span>
          </div>
        </div>
      )}
    </div>
  );
}