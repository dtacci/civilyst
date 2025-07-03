'use client';

import React, { useState, useRef } from 'react';
import { cn } from '~/lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';
import {
  ThumbsUp,
  ThumbsDown,
  Heart,
  Users,
  Zap,
  Loader2,
  Check,
  X,
} from 'lucide-react';

export interface VotingInterfaceProps {
  campaignId: string;
  currentVoteCount: number;
  userVote?: 'SUPPORT' | 'OPPOSE' | null;
  isVoting?: boolean;
  onVote: (voteType: 'SUPPORT' | 'OPPOSE') => void;
  className?: string;
  variant?: 'default' | 'compact' | 'gesture';
  disabled?: boolean;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  campaignId, // Used for analytics and debugging
  currentVoteCount,
  userVote,
  isVoting = false,
  onVote,
  className,
  variant = 'default',
  disabled = false,
}) => {
  const [gestureState, setGestureState] = useState<{
    isActive: boolean;
    direction: 'SUPPORT' | 'OPPOSE' | null;
    progress: number;
    velocity: number;
    startTime: number;
  }>({
    isActive: false,
    direction: null,
    progress: 0,
    velocity: 0,
    startTime: 0,
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [lastVote, setLastVote] = useState<'SUPPORT' | 'OPPOSE' | null>(null);
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      type: 'SUPPORT' | 'OPPOSE';
    }>
  >([]);

  const gestureRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const lastPosition = useRef<{ x: number; y: number; time: number }>({
    x: 0,
    y: 0,
    time: 0,
  });

  // Enhanced haptic feedback simulation
  const simulateHaptic = (
    type:
      | 'light'
      | 'medium'
      | 'heavy'
      | 'success'
      | 'error'
      | 'progress' = 'medium'
  ) => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50],
        success: [30, 10, 30, 10, 50], // Celebratory pattern
        error: [100, 50, 100], // Warning pattern
        progress: [5, 5, 5], // Light progress feedback
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Create particle explosion effect
  const createParticles = (
    x: number,
    y: number,
    type: 'SUPPORT' | 'OPPOSE',
    count: number = 8
  ) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200 - 50,
      life: 1,
      type,
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    // Clean up particles after animation
    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id))
      );
    }, 1000);
  };

  // Calculate gesture velocity
  const calculateVelocity = (currentX: number, currentTime: number) => {
    const deltaX = currentX - lastPosition.current.x;
    const deltaTime = currentTime - lastPosition.current.time;
    return deltaTime > 0 ? Math.abs(deltaX / deltaTime) : 0;
  };

  // Handle touch start for gesture voting
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isVoting || variant !== 'gesture') return;

    const touch = e.touches[0];
    const currentTime = Date.now();

    startX.current = touch.clientX;
    startY.current = touch.clientY;
    lastPosition.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: currentTime,
    };

    setGestureState((prev) => ({
      ...prev,
      isActive: true,
      startTime: currentTime,
      velocity: 0,
    }));
    simulateHaptic('light');
  };

  // Handle touch move for gesture progress
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gestureState.isActive || disabled || isVoting) return;

    const touch = e.touches[0];
    const currentTime = Date.now();
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - startY.current);

    // Only horizontal gestures, more lenient for mobile
    if (deltaY > 80) return;

    // Calculate velocity for more responsive feedback
    const velocity = calculateVelocity(touch.clientX, currentTime);

    // Dynamic threshold based on velocity - faster swipes require less distance
    const baseThreshold = 100;
    const velocityThreshold = Math.max(baseThreshold - velocity * 0.1, 60);
    const threshold = Math.min(velocityThreshold, baseThreshold);

    const progress = Math.min(Math.abs(deltaX) / threshold, 1);

    let direction: 'SUPPORT' | 'OPPOSE' | null = null;
    if (Math.abs(deltaX) > 15) {
      // Lowered threshold for quicker response
      direction = deltaX > 0 ? 'SUPPORT' : 'OPPOSE';

      // Progressive haptic feedback based on progress
      if (progress > 0.25 && progress <= 0.5) {
        simulateHaptic('progress');
      } else if (progress > 0.5 && progress <= 0.75) {
        simulateHaptic('light');
      } else if (progress > 0.75 && progress < 1) {
        simulateHaptic('medium');
      }
    }

    // Update position tracking
    lastPosition.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: currentTime,
    };

    setGestureState((prev) => ({
      ...prev,
      direction,
      progress,
      velocity,
    }));
  };

  // Handle touch end for gesture completion
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!gestureState.isActive || disabled || isVoting) return;

    // Consider both progress and velocity for vote completion
    const quickSwipe =
      gestureState.velocity > 0.5 && gestureState.progress > 0.6;
    const fullProgress = gestureState.progress >= 1;

    if ((quickSwipe || fullProgress) && gestureState.direction) {
      // Complete the vote with celebration
      simulateHaptic('success');

      // Create particle effect at touch end position
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const rect = gestureRef.current?.getBoundingClientRect();
        if (rect) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          createParticles(x, y, gestureState.direction, 12);
        }
      }

      onVote(gestureState.direction);
      setLastVote(gestureState.direction);
      setShowFeedback(true);

      // Hide feedback after animation
      setTimeout(() => setShowFeedback(false), 3000);
    } else if (gestureState.progress > 0.3) {
      // Provide feedback for incomplete gesture
      simulateHaptic('error');
    } else {
      // Reset gesture quietly
      simulateHaptic('light');
    }

    setGestureState({
      isActive: false,
      direction: null,
      progress: 0,
      velocity: 0,
      startTime: 0,
    });
  };

  // Handle button vote
  const handleButtonVote = (
    voteType: 'SUPPORT' | 'OPPOSE',
    event?: React.MouseEvent
  ) => {
    if (disabled || isVoting) return;

    simulateHaptic('success');

    // Create particle effect at click position
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      createParticles(x, y, voteType, 8);
    }

    onVote(voteType);
    setLastVote(voteType);
    setShowFeedback(true);

    setTimeout(() => setShowFeedback(false), 3000);
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-4 bg-gradient-to-r from-[--color-surface] to-[--color-surface-elevated] rounded-[--border-radius-lg] border border-[--color-border]',
          className
        )}
      >
        <Button
          variant={userVote === 'SUPPORT' ? 'default' : 'outline'}
          size="sm"
          onClick={(e) => handleButtonVote('SUPPORT', e)}
          disabled={disabled || isVoting}
          className="flex-1"
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          {currentVoteCount}
        </Button>

        <Button
          variant={userVote === 'OPPOSE' ? 'destructive' : 'outline'}
          size="sm"
          onClick={(e) => handleButtonVote('OPPOSE', e)}
          disabled={disabled || isVoting}
          className="flex-1"
        >
          <ThumbsDown className="h-4 w-4 mr-2" />
          Oppose
        </Button>
      </div>
    );
  }

  // Render gesture variant
  if (variant === 'gesture') {
    return (
      <Card className={cn('overflow-hidden relative', className)}>
        <CardContent className="p-0">
          <div
            ref={gestureRef}
            className={cn(
              'relative min-h-[140px] touch-pan-y transition-all duration-300',
              'bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50',
              gestureState.isActive && 'scale-[1.02] shadow-lg',
              gestureState.direction === 'SUPPORT' &&
                gestureState.progress > 0.5 &&
                'bg-gradient-to-r from-emerald-100 via-emerald-50 to-emerald-100',
              gestureState.direction === 'OPPOSE' &&
                gestureState.progress > 0.5 &&
                'bg-gradient-to-r from-red-100 via-red-50 to-red-100'
            )}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Particle Effects */}
            {particles.map((particle) => (
              <div
                key={particle.id}
                className={cn(
                  'absolute w-2 h-2 rounded-full pointer-events-none animate-ping',
                  particle.type === 'SUPPORT' ? 'bg-emerald-500' : 'bg-red-500'
                )}
                style={{
                  left: particle.x,
                  top: particle.y,
                  transform: `translate(${particle.vx * 0.1}px, ${particle.vy * 0.1}px)`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
            {/* Gesture Indicators */}
            <div className="absolute inset-0 flex">
              {/* Support Side */}
              <div
                className={cn(
                  'flex-1 flex items-center justify-center transition-all duration-200',
                  gestureState.direction === 'SUPPORT' &&
                    gestureState.progress > 0.25
                    ? cn(
                        'bg-emerald-100/80 backdrop-blur-sm',
                        gestureState.progress > 0.75 &&
                          'scale-110 bg-emerald-200/90'
                      )
                    : 'bg-transparent'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col items-center transition-all duration-200 relative',
                    gestureState.direction === 'SUPPORT'
                      ? cn(
                          'text-emerald-600',
                          gestureState.progress > 0.5 && 'scale-125',
                          gestureState.progress > 0.75 &&
                            'scale-150 animate-pulse'
                        )
                      : 'text-slate-400'
                  )}
                >
                  <ThumbsUp
                    className={cn(
                      'h-8 w-8 mb-2 transition-all duration-200',
                      gestureState.direction === 'SUPPORT' &&
                        gestureState.progress > 0.8 &&
                        'drop-shadow-lg'
                    )}
                  />
                  <span className="text-sm font-medium">Support</span>
                  <span className="text-xs font-bold bg-white/80 px-2 py-1 rounded-full">
                    {currentVoteCount}
                  </span>

                  {/* Ripple effect */}
                  {gestureState.direction === 'SUPPORT' &&
                    gestureState.progress > 0.6 && (
                      <div className="absolute inset-0 animate-ping bg-emerald-300/30 rounded-full scale-150" />
                    )}
                </div>
              </div>

              {/* Oppose Side */}
              <div
                className={cn(
                  'flex-1 flex items-center justify-center transition-all duration-200',
                  gestureState.direction === 'OPPOSE' &&
                    gestureState.progress > 0.25
                    ? cn(
                        'bg-red-100/80 backdrop-blur-sm',
                        gestureState.progress > 0.75 &&
                          'scale-110 bg-red-200/90'
                      )
                    : 'bg-transparent'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col items-center transition-all duration-200 relative',
                    gestureState.direction === 'OPPOSE'
                      ? cn(
                          'text-red-600',
                          gestureState.progress > 0.5 && 'scale-125',
                          gestureState.progress > 0.75 &&
                            'scale-150 animate-pulse'
                        )
                      : 'text-slate-400'
                  )}
                >
                  <ThumbsDown
                    className={cn(
                      'h-8 w-8 mb-2 transition-all duration-200',
                      gestureState.direction === 'OPPOSE' &&
                        gestureState.progress > 0.8 &&
                        'drop-shadow-lg'
                    )}
                  />
                  <span className="text-sm font-medium">Oppose</span>
                  <span className="text-xs font-bold bg-white/80 px-2 py-1 rounded-full">
                    Concerns
                  </span>

                  {/* Ripple effect */}
                  {gestureState.direction === 'OPPOSE' &&
                    gestureState.progress > 0.6 && (
                      <div className="absolute inset-0 animate-ping bg-red-300/30 rounded-full scale-150" />
                    )}
                </div>
              </div>
            </div>

            {/* Enhanced Progress Indicator */}
            {gestureState.isActive && gestureState.direction && (
              <div className="absolute bottom-0 left-0 right-0">
                {/* Background track */}
                <div className="h-2 bg-slate-200/60 backdrop-blur-sm">
                  <div
                    className={cn(
                      'h-full transition-all duration-100 relative overflow-hidden',
                      gestureState.direction === 'SUPPORT'
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-red-400 to-red-600',
                      gestureState.progress > 0.75 && 'shadow-lg'
                    )}
                    style={{ width: `${gestureState.progress * 100}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>

                {/* Progress percentage indicator */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <div
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-bold transition-all duration-200',
                      gestureState.direction === 'SUPPORT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-red-100 text-red-800 border border-red-200',
                      gestureState.progress > 0.8 && 'animate-bounce'
                    )}
                  >
                    {Math.round(gestureState.progress * 100)}%
                  </div>
                </div>
              </div>
            )}

            {/* Velocity Indicator */}
            {gestureState.isActive && gestureState.velocity > 0.3 && (
              <div className="absolute top-4 right-4">
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                    'bg-blue-100 text-blue-800 border border-blue-200'
                  )}
                >
                  <Zap className="h-3 w-3" />
                  Fast
                </div>
              </div>
            )}

            {/* Dynamic Instructions */}
            {!gestureState.isActive && (
              <div className="absolute top-4 left-0 right-0 text-center">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-slate-600 font-medium">
                    ← Swipe left to oppose • Swipe right to support →
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Quick swipes count too!</span>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Success/Error State Overlay */}
            {showFeedback && lastVote && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                <div
                  className={cn(
                    'p-6 rounded-xl shadow-xl border-2 animate-bounce',
                    lastVote === 'SUPPORT'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    {lastVote === 'SUPPORT' ? (
                      <ThumbsUp className="h-8 w-8" />
                    ) : (
                      <ThumbsDown className="h-8 w-8" />
                    )}
                    <span className="font-bold text-lg">Vote Recorded!</span>
                    <span className="text-sm">Thank you for participating</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-campaign-id={campaignId}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
            Support this campaign
          </h3>
          <div className="flex items-center justify-center gap-2 text-[--color-text-secondary]">
            <Users className="h-4 w-4" />
            <span className="text-sm">{currentVoteCount} total votes</span>
          </div>
        </div>

        {/* Voting Loading State */}
        {isVoting && (
          <div className="mb-6 p-4 bg-[--color-primary]/10 border border-[--color-primary]/20 rounded-[--border-radius-lg]">
            <div className="flex items-center justify-center text-[--color-primary]">
              <Loader2 className="animate-spin h-5 w-5 mr-3" />
              <span className="font-medium">Submitting your vote...</span>
            </div>
          </div>
        )}

        {/* Success Feedback */}
        {showFeedback && lastVote && (
          <div
            className={cn(
              'mb-6 p-4 border rounded-[--border-radius-lg] animate-[slideUp_0.3s_ease-out]',
              lastVote === 'SUPPORT'
                ? 'bg-[--color-success]/10 border-[--color-success]/20 text-[--color-success]'
                : 'bg-[--color-danger]/10 border-[--color-danger]/20 text-[--color-danger]'
            )}
          >
            <div className="flex items-center justify-center">
              {lastVote === 'SUPPORT' ? (
                <Check className="h-5 w-5 mr-3" />
              ) : (
                <X className="h-5 w-5 mr-3" />
              )}
              <span className="font-medium">
                Vote recorded! Thank you for participating.
              </span>
            </div>
          </div>
        )}

        {/* Vote Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant={userVote === 'SUPPORT' ? 'default' : 'outline'}
            size="lg"
            onClick={(e) => handleButtonVote('SUPPORT', e)}
            disabled={disabled || isVoting}
            className={cn(
              'flex-1 h-14 text-base font-medium transition-all duration-300 group',
              userVote === 'SUPPORT'
                ? 'bg-[--color-success] hover:bg-[--color-success-hover] text-white shadow-[--shadow-button]'
                : 'border-[--color-success] text-[--color-success] hover:bg-[--color-success]/10'
            )}
          >
            <div className="flex items-center justify-center gap-3">
              <ThumbsUp className="h-5 w-5 transition-transform group-hover:scale-110" />
              <div className="flex flex-col items-center">
                <span>Support</span>
                <span className="text-sm opacity-80">({currentVoteCount})</span>
              </div>
              <Heart className="h-4 w-4 opacity-60 transition-transform group-hover:scale-125" />
            </div>
          </Button>

          <Button
            variant={userVote === 'OPPOSE' ? 'destructive' : 'outline'}
            size="lg"
            onClick={(e) => handleButtonVote('OPPOSE', e)}
            disabled={disabled || isVoting}
            className={cn(
              'flex-1 h-14 text-base font-medium transition-all duration-300 group',
              userVote === 'OPPOSE'
                ? 'bg-[--color-danger] hover:bg-[--color-danger-hover] text-white shadow-[--shadow-button]'
                : 'border-[--color-danger] text-[--color-danger] hover:bg-[--color-danger]/10'
            )}
          >
            <div className="flex items-center justify-center gap-3">
              <ThumbsDown className="h-5 w-5 transition-transform group-hover:scale-110" />
              <div className="flex flex-col items-center">
                <span>Oppose</span>
                <span className="text-sm opacity-80">Concerns</span>
              </div>
              <Zap className="h-4 w-4 opacity-60 transition-transform group-hover:scale-125" />
            </div>
          </Button>
        </div>

        {/* Mobile Instructions */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[--color-text-secondary]">
            💡 Tip: Long press for haptic feedback
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingInterface;
