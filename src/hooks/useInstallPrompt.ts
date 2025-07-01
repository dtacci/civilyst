'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface InstallPromptState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  canPrompt: boolean;
  platform: string | null;
}

export interface UseInstallPromptReturn extends InstallPromptState {
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
  checkInstallability: () => void;
}

/**
 * Hook to manage PWA installation prompts across different platforms
 */
export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [platform, setPlatform] = useState<string | null>(null);

  // Check if running in standalone mode (already installed)
  const checkStandaloneMode = useCallback(() => {
    if (typeof window === 'undefined') return false;

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }, []);

  // Detect iOS devices
  const checkIsIOS = useCallback(() => {
    if (typeof window === 'undefined') return false;

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }, []);

  // Detect platform
  const detectPlatform = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) return 'Android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad'))
      return 'iOS';
    if (userAgent.includes('windows')) return 'Windows';
    if (userAgent.includes('mac')) return 'macOS';
    if (userAgent.includes('linux')) return 'Linux';

    return 'Unknown';
  }, []);

  // Check if app is installable
  const checkInstallability = useCallback(() => {
    const standalone = checkStandaloneMode();
    const ios = checkIsIOS();
    const detectedPlatform = detectPlatform();

    setIsStandalone(standalone);
    setIsIOS(ios);
    setPlatform(detectedPlatform);
    setIsInstalled(standalone);

    // App is installable if:
    // 1. Not already in standalone mode
    // 2. Has deferred prompt (Chrome/Edge) OR is iOS
    // 3. Not already dismissed by user
    const installable = !standalone && (!!deferredPrompt || ios);
    setIsInstallable(installable);
    setCanPrompt(!!deferredPrompt && !standalone);
  }, [deferredPrompt, checkStandaloneMode, checkIsIOS, detectPlatform]);

  // Handle beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();

      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setCanPrompt(false);
      setDeferredPrompt(null);
    };

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check
    checkInstallability();

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkInstallability]);

  // Re-check installability when deferred prompt changes
  useEffect(() => {
    checkInstallability();
  }, [deferredPrompt, checkInstallability]);

  // Show the install prompt
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      // Show the prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setCanPrompt(false);
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      throw error;
    }
  }, [deferredPrompt]);

  // Dismiss the prompt (user can still install later)
  const dismissPrompt = useCallback(() => {
    setCanPrompt(false);
    // Don't clear deferredPrompt - user might change their mind
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    canPrompt,
    platform,
    promptInstall,
    dismissPrompt,
    checkInstallability,
  };
}
