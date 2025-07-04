'use client';

import { useState, useEffect, useCallback } from 'react';
import { Share2, Zap, Users, TrendingUp } from 'lucide-react';
import { Button } from '../../ui/button';
import { SocialShare, type SocialShareData } from './social-share';
import { cn } from '~/lib/utils';

interface FloatingShareFabProps {
  data: SocialShareData;
  className?: string;
  showOnScroll?: boolean;
  scrollThreshold?: number;
}

export function FloatingShareFab({
  data,
  className,
  showOnScroll = true,
  scrollThreshold = 300,
}: FloatingShareFabProps) {
  const [isVisible, setIsVisible] = useState(!showOnScroll);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCount, setShareCount] = useState(0);

  // Handle scroll visibility
  useEffect(() => {
    if (!showOnScroll) return;

    const handleScroll = () => {
      const scrolled = window.scrollY > scrollThreshold;
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showOnScroll, scrollThreshold]);

  // Track shares (in real implementation, this would connect to analytics)
  const handleShareClick = useCallback(() => {
    setShowShareModal(true);
    setShareCount((prev) => prev + 1);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div
        className={cn(
          'fixed bottom-20 left-6 z-[--z-floating] transition-all duration-300',
          'safe-area-bottom-padding',
          className
        )}
      >
        <Button
          onClick={handleShareClick}
          size="lg"
          className={cn(
            'h-12 w-12 rounded-full shadow-[--shadow-floating] border-2 border-[--color-border-strong]',
            'bg-gradient-to-br from-blue-500 to-purple-600',
            'hover:shadow-[--shadow-floating-hover] hover:scale-110',
            'active:scale-95 transition-all duration-200',
            'group relative overflow-hidden'
          )}
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

          {/* Share Icon with Animation */}
          <Share2
            className={cn(
              'h-5 w-5 text-white transition-transform duration-200',
              'group-hover:rotate-12 group-active:scale-110'
            )}
          />

          {/* Pulse Animation for Engagement */}
          {shareCount > 0 && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
          )}
        </Button>

        {/* Quick Stats Badge */}
        {data.voteCount && data.voteCount > 0 && (
          <div
            className={cn(
              'absolute -top-2 -left-8 px-2 py-1 rounded-full',
              'bg-[--color-surface-elevated] border border-[--color-border-subtle]',
              'text-[--font-size-xs] font-medium text-[--color-text-secondary]',
              'shadow-sm animate-scale-in min-w-[60px] text-center'
            )}
          >
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span>{data.voteCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-[--z-modal] flex items-end justify-center p-4">
          <div className="w-full max-w-md relative">
            {/* Enhanced Share Component */}
            <div className="bg-[--color-surface-elevated] rounded-t-[--border-radius-xl] shadow-[--shadow-modal] overflow-hidden">
              {/* Header with Viral Metrics */}
              <div className="p-4 border-b border-[--color-border-subtle] bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[--color-text-primary]">
                      Share Platform
                    </h3>
                    <p className="text-[--font-size-sm] text-[--color-text-secondary]">
                      Spread civic engagement!
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[--font-size-sm]">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">{shareCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">Viral</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Share Component */}
              <SocialShare
                data={data}
                variant="default"
                showAnalytics={true}
                className="border-0 shadow-none"
              />
            </div>

            {/* Background Click to Close */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-transparent -z-10"
              aria-label="Close sharing options"
            />

            {/* Close Button */}
            <Button
              onClick={() => setShowShareModal(false)}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-[--color-text-tertiary] hover:text-[--color-text-primary]"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
