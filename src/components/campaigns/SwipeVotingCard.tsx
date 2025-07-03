'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  ThumbsUp,
  ThumbsDown,
  MapPin,
  User,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { cn } from '~/lib/utils';
import { Card, CardContent } from '~/components/ui/card';
import { CampaignCardData } from './CampaignCard';

export interface SwipeVotingCardProps {
  campaign: CampaignCardData;
  onVote: (campaignId: string, voteType: 'SUPPORT' | 'OPPOSE') => void;
  userVote?: 'SUPPORT' | 'OPPOSE' | null;
  isVoting?: boolean;
  className?: string;
}

export function SwipeVotingCard({
  campaign,
  onVote,
  userVote,
  isVoting = false,
  className,
}: SwipeVotingCardProps) {
  const [gestureState, setGestureState] = useState<{
    isActive: boolean;
    direction: 'SUPPORT' | 'OPPOSE' | null;
    progress: number;
    velocity: number;
    isDragging: boolean;
    transformX: number;
  }>({
    isActive: false,
    direction: null,
    progress: 0,
    velocity: 0,
    isDragging: false,
    transformX: 0,
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [lastVote, setLastVote] = useState<'SUPPORT' | 'OPPOSE' | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const lastPosition = useRef<{ x: number; time: number }>({ x: 0, time: 0 });

  // Enhanced haptic feedback
  const simulateHaptic = (
    type: 'light' | 'medium' | 'heavy' | 'success' = 'medium'
  ) => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50],
        success: [30, 10, 30, 10, 50],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Calculate velocity for responsive feedback
  const calculateVelocity = (currentX: number, currentTime: number) => {
    const deltaX = currentX - lastPosition.current.x;
    const deltaTime = currentTime - lastPosition.current.time;
    return deltaTime > 0 ? Math.abs(deltaX / deltaTime) : 0;
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isVoting || userVote) return;

    const touch = e.touches[0];
    const currentTime = Date.now();

    startX.current = touch.clientX;
    startY.current = touch.clientY;
    lastPosition.current = { x: touch.clientX, time: currentTime };

    setGestureState((prev) => ({
      ...prev,
      isActive: true,
      isDragging: false,
      velocity: 0,
    }));

    simulateHaptic('light');
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gestureState.isActive || isVoting || userVote) return;

    const touch = e.touches[0];
    const currentTime = Date.now();
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - startY.current);

    // Allow more vertical movement for scrolling
    if (deltaY > 120 && Math.abs(deltaX) < 30) {
      // Reset gesture to allow scrolling
      setGestureState((prev) => ({
        ...prev,
        isActive: false,
        isDragging: false,
        transformX: 0,
      }));
      return;
    }

    // Prevent default only when we're clearly swiping horizontally
    if (Math.abs(deltaX) > 20) {
      e.preventDefault();
      setGestureState((prev) => ({ ...prev, isDragging: true }));
    }

    // Calculate velocity and progress
    const velocity = calculateVelocity(touch.clientX, currentTime);
    const threshold = 120;
    const progress = Math.min(Math.abs(deltaX) / threshold, 1);

    let direction: 'SUPPORT' | 'OPPOSE' | null = null;
    if (Math.abs(deltaX) > 20) {
      direction = deltaX > 0 ? 'SUPPORT' : 'OPPOSE';

      // Progressive haptic feedback
      if (progress > 0.3 && progress <= 0.6) {
        simulateHaptic('light');
      } else if (progress > 0.6 && progress <= 0.8) {
        simulateHaptic('medium');
      }
    }

    // Update position tracking
    lastPosition.current = { x: touch.clientX, time: currentTime };

    // Apply transform for visual feedback
    const maxTransform = 100;
    const transformX = Math.max(
      -maxTransform,
      Math.min(maxTransform, deltaX * 0.6)
    );

    setGestureState((prev) => ({
      ...prev,
      direction,
      progress,
      velocity,
      transformX,
    }));
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!gestureState.isActive || isVoting || userVote) return;

    // Check if we should complete the vote
    const quickSwipe =
      gestureState.velocity > 0.4 && gestureState.progress > 0.5;
    const fullProgress = gestureState.progress >= 0.8;

    if (
      (quickSwipe || fullProgress) &&
      gestureState.direction &&
      gestureState.isDragging
    ) {
      // Complete the vote
      simulateHaptic('success');
      onVote(campaign.id, gestureState.direction);
      setLastVote(gestureState.direction);
      setShowFeedback(true);

      setTimeout(() => setShowFeedback(false), 2500);
    } else if (gestureState.progress > 0.2) {
      simulateHaptic('light');
    }

    // Reset gesture state with smooth animation
    setGestureState({
      isActive: false,
      direction: null,
      progress: 0,
      velocity: 0,
      isDragging: false,
      transformX: 0,
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'DRAFT':
        return 'Draft';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusStyles = (status: string) => {
    const baseStyles =
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';

    switch (status) {
      case 'ACTIVE':
        return cn(
          baseStyles,
          'bg-emerald-100 text-emerald-800 border border-emerald-200'
        );
      case 'DRAFT':
        return cn(
          baseStyles,
          'bg-amber-100 text-amber-800 border border-amber-200'
        );
      case 'COMPLETED':
        return cn(
          baseStyles,
          'bg-blue-100 text-blue-800 border border-blue-200'
        );
      case 'CANCELLED':
        return cn(baseStyles, 'bg-red-100 text-red-800 border border-red-200');
      default:
        return cn(
          baseStyles,
          'bg-slate-100 text-slate-800 border border-slate-200'
        );
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Swipe Action Backgrounds */}
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        {/* Support Background */}
        <div
          className={cn(
            'flex-1 flex items-center justify-start pl-8 transition-all duration-200',
            'bg-gradient-to-r from-emerald-400 to-emerald-500',
            gestureState.direction === 'SUPPORT' && gestureState.progress > 0.3
              ? 'opacity-100 scale-105'
              : 'opacity-0'
          )}
        >
          <div className="flex items-center gap-3 text-white">
            <ThumbsUp className="h-6 w-6" />
            <div className="font-semibold">
              <div>Support</div>
              <div className="text-sm opacity-90">Swipe to vote</div>
            </div>
          </div>
        </div>

        {/* Oppose Background */}
        <div
          className={cn(
            'flex-1 flex items-center justify-end pr-8 transition-all duration-200',
            'bg-gradient-to-l from-red-400 to-red-500',
            gestureState.direction === 'OPPOSE' && gestureState.progress > 0.3
              ? 'opacity-100 scale-105'
              : 'opacity-0'
          )}
        >
          <div className="flex items-center gap-3 text-white">
            <div className="font-semibold text-right">
              <div>Oppose</div>
              <div className="text-sm opacity-90">Swipe to vote</div>
            </div>
            <ThumbsDown className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Card */}
      <Card
        ref={cardRef}
        className={cn(
          'relative bg-white transition-all duration-200 border-2',
          gestureState.isDragging && 'shadow-xl z-10',
          gestureState.direction === 'SUPPORT' &&
            gestureState.progress > 0.5 &&
            'border-emerald-300',
          gestureState.direction === 'OPPOSE' &&
            gestureState.progress > 0.5 &&
            'border-red-300',
          userVote === 'SUPPORT' && 'border-emerald-300 bg-emerald-50',
          userVote === 'OPPOSE' && 'border-red-300 bg-red-50'
        )}
        style={{
          transform: `translateX(${gestureState.transformX}px) scale(${gestureState.isDragging ? 0.98 : 1})`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="flex-1 min-w-0"
              onClick={(e) => gestureState.isDragging && e.preventDefault()}
            >
              <h3 className="font-semibold text-slate-900 line-clamp-2 text-lg leading-tight">
                {campaign.title}
              </h3>
            </Link>

            {/* Vote Status Indicator */}
            {userVote && (
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
                  userVote === 'SUPPORT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                )}
              >
                {userVote === 'SUPPORT' ? (
                  <ThumbsUp className="h-3 w-3" />
                ) : (
                  <ThumbsDown className="h-3 w-3" />
                )}
                Voted
              </div>
            )}
          </div>

          {/* Status and Time */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={getStatusStyles(campaign.status)}>
              {getStatusLabel(campaign.status)}
            </span>
            <span className="text-sm text-slate-500">
              {formatDistanceToNow(campaign.createdAt, { addSuffix: true })}
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
            {campaign.description}
          </p>

          {/* Location */}
          {(campaign.address || campaign.city) && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {campaign.address ||
                  [campaign.city, campaign.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {/* Creator */}
            {campaign.creator && (
              <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0 flex-1">
                <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-slate-500" />
                </div>
                <span className="truncate text-xs">
                  {campaign.creator.firstName} {campaign.creator.lastName}
                </span>
              </div>
            )}

            {/* Engagement Stats */}
            {campaign._count && (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="font-medium">{campaign._count.votes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {campaign._count.comments}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Swipe Instructions */}
          {!userVote && !gestureState.isActive && (
            <div className="text-center py-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium">
                ← Swipe left to oppose • Swipe right to support →
              </p>
            </div>
          )}
        </CardContent>

        {/* Progress Indicator */}
        {gestureState.isActive &&
          gestureState.direction &&
          gestureState.isDragging && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
              <div
                className={cn(
                  'h-full transition-all duration-100',
                  gestureState.direction === 'SUPPORT'
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${gestureState.progress * 100}%` }}
              />
            </div>
          )}

        {/* Success/Error Feedback Overlay */}
        {showFeedback && lastVote && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
            <div
              className={cn(
                'p-4 rounded-xl shadow-xl border-2 animate-bounce bg-white',
                lastVote === 'SUPPORT'
                  ? 'border-emerald-300 text-emerald-800'
                  : 'border-red-300 text-red-800'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                {lastVote === 'SUPPORT' ? (
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-6 w-6" />
                    <Heart className="h-5 w-5 text-emerald-600" />
                  </div>
                ) : (
                  <ThumbsDown className="h-6 w-6" />
                )}
                <span className="font-bold">Vote Recorded!</span>
                <span className="text-sm text-center">
                  Thank you for participating
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
