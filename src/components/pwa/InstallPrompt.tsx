'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';
import { useInstallPrompt } from '~/hooks/useInstallPrompt';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface InstallPromptProps {
  /**
   * Whether to show the prompt automatically when installable
   * @default true
   */
  autoShow?: boolean;

  /**
   * Delay before showing the prompt (in milliseconds)
   * @default 5000
   */
  showDelay?: number;

  /**
   * Whether to show the prompt only once per session
   * @default true
   */
  oncePerSession?: boolean;

  /**
   * Custom CSS class
   */
  className?: string;

  /**
   * Display variant
   * @default 'banner'
   */
  variant?: 'banner' | 'modal' | 'fab' | 'inline';

  /**
   * Callback when user installs the app
   */
  onInstall?: () => void;

  /**
   * Callback when user dismisses the prompt
   */
  onDismiss?: () => void;
}

/**
 * PWA Install Prompt Component
 * Handles installation prompts across different platforms with various display options
 */
export function InstallPrompt({
  autoShow = true,
  showDelay = 5000,
  oncePerSession = true,
  className,
  variant = 'banner',
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    canPrompt,
    platform,
    promptInstall,
    dismissPrompt: dismissInstallPrompt,
  } = useInstallPrompt();

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Check if we should show the prompt
  const shouldShow = useCallback(() => {
    if (isInstalled || isStandalone || isDismissed) return false;
    if (oncePerSession && hasShownOnce) return false;
    return isInstallable;
  }, [
    isInstalled,
    isStandalone,
    isDismissed,
    oncePerSession,
    hasShownOnce,
    isInstallable,
  ]);

  // Auto-show logic
  useEffect(() => {
    if (!autoShow || !shouldShow()) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasShownOnce(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [autoShow, shouldShow, showDelay]);

  // Handle install button click
  const handleInstall = useCallback(async () => {
    try {
      if (canPrompt) {
        await promptInstall();
        setIsVisible(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Failed to install app:', error);
    }
  }, [canPrompt, promptInstall, onInstall]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    dismissInstallPrompt();
    onDismiss?.();
  }, [dismissInstallPrompt, onDismiss]);

  // Manual show (for external triggers) - currently unused but kept for API completeness
  // const show = useCallback(() => {
  //   if (shouldShow()) {
  //     setIsVisible(true);
  //     setHasShownOnce(true);
  //   }
  // }, [shouldShow]);

  // Don't render if not installable or already installed
  if (!isInstallable || isInstalled || isStandalone || !isVisible) {
    return null;
  }

  // iOS-specific instructions
  const IOSInstructions = () => (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
          <Share className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-sm">Tap the Share button</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
          <Plus className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-sm">Select &quot;Add to Home Screen&quot;</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
          <Download className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-sm">Tap &quot;Add&quot; to install</span>
      </div>
    </div>
  );

  // Render different variants
  if (variant === 'fab') {
    return (
      <div className={cn('fixed bottom-4 right-4 z-50', className)}>
        <Button
          onClick={isIOS ? () => setIsVisible(true) : handleInstall}
          className="h-14 w-14 rounded-full shadow-lg"
          title="Install Civilyst App"
        >
          <Download className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-4',
          className
        )}
      >
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              Install Civilyst App
            </h3>
            <p className="text-sm text-gray-600">
              Get the full experience with offline access and push notifications
            </p>
            {isIOS ? (
              <div className="mt-2">
                <IOSInstructions />
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                className="mt-3"
                disabled={!canPrompt}
              >
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          className={cn(
            'w-full max-w-md rounded-lg bg-white p-6 shadow-xl',
            className
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Install Civilyst
                </h2>
                <p className="text-sm text-gray-600">Platform: {platform}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-gray-700">
              Add Civilyst to your home screen for quick access and a better
              experience.
            </p>

            {isIOS ? (
              <div className="mt-4">
                <IOSInstructions />
              </div>
            ) : (
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={handleInstall}
                  disabled={!canPrompt}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default banner variant
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Install Civilyst App</p>
              <p className="text-sm text-gray-600">
                {isIOS
                  ? 'Tap the share button and "Add to Home Screen"'
                  : 'Get the app for a better experience'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isIOS && canPrompt && (
              <Button onClick={handleInstall} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Install
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export hook for external control
export { useInstallPrompt };
