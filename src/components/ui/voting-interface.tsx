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
  X
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
  campaignId,
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
  }>({ isActive: false, direction: null, progress: 0 });
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastVote, setLastVote] = useState<'SUPPORT' | 'OPPOSE' | null>(null);
  
  const gestureRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  // Haptic feedback simulation
  const simulateHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Handle touch start for gesture voting
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isVoting || variant !== 'gesture') return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    
    setGestureState(prev => ({ ...prev, isActive: true }));
    simulateHaptic('light');
  };

  // Handle touch move for gesture progress
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gestureState.isActive || disabled || isVoting) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - startY.current);
    
    // Only horizontal gestures
    if (deltaY > 50) return;
    
    const threshold = 100; // pixels to trigger vote
    const progress = Math.min(Math.abs(deltaX) / threshold, 1);
    
    let direction: 'SUPPORT' | 'OPPOSE' | null = null;
    if (Math.abs(deltaX) > 20) {
      direction = deltaX > 0 ? 'SUPPORT' : 'OPPOSE';
      if (progress > 0.3) simulateHaptic('light');
    }
    
    setGestureState(prev => ({
      ...prev,
      direction,
      progress
    }));
  };

  // Handle touch end for gesture completion
  const handleTouchEnd = () => {
    if (!gestureState.isActive || disabled || isVoting) return;
    
    if (gestureState.progress >= 1 && gestureState.direction) {
      // Complete the vote
      simulateHaptic('heavy');
      onVote(gestureState.direction);
      setLastVote(gestureState.direction);
      setShowFeedback(true);
      
      // Hide feedback after animation
      setTimeout(() => setShowFeedback(false), 2000);
    } else {
      // Reset gesture
      simulateHaptic('light');
    }
    
    setGestureState({ isActive: false, direction: null, progress: 0 });
  };

  // Handle button vote
  const handleButtonVote = (voteType: 'SUPPORT' | 'OPPOSE') => {
    if (disabled || isVoting) return;
    
    simulateHaptic('medium');
    onVote(voteType);
    setLastVote(voteType);
    setShowFeedback(true);
    
    setTimeout(() => setShowFeedback(false), 2000);
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-3 p-4 bg-gradient-to-r from-[--color-surface] to-[--color-surface-elevated] rounded-[--border-radius-lg] border border-[--color-border]",
        className
      )}>
        <Button
          variant={userVote === 'SUPPORT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleButtonVote('SUPPORT')}
          disabled={disabled || isVoting}
          className="flex-1"
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          {currentVoteCount}
        </Button>
        
        <Button
          variant={userVote === 'OPPOSE' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => handleButtonVote('OPPOSE')}
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
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-0">
          <div 
            ref={gestureRef}
            className="relative min-h-[120px] bg-gradient-to-r from-[--color-primary]/5 via-[--color-surface] to-[--color-success]/5 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Gesture Indicators */}
            <div className="absolute inset-0 flex">
              {/* Support Side */}
              <div 
                className={cn(
                  "flex-1 flex items-center justify-center transition-all duration-300",
                  gestureState.direction === 'SUPPORT' && gestureState.progress > 0.3
                    ? "bg-[--color-success]/20 scale-105"
                    : "bg-transparent"
                )}
              >
                <div className={cn(
                  "flex flex-col items-center transition-all duration-300",
                  gestureState.direction === 'SUPPORT' 
                    ? "scale-110 text-[--color-success]" 
                    : "text-[--color-text-secondary]"
                )}>
                  <ThumbsUp className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Support</span>
                  <span className="text-xs">{currentVoteCount}</span>
                </div>
              </div>

              {/* Oppose Side */}
              <div 
                className={cn(
                  "flex-1 flex items-center justify-center transition-all duration-300",
                  gestureState.direction === 'OPPOSE' && gestureState.progress > 0.3
                    ? "bg-[--color-danger]/20 scale-105"
                    : "bg-transparent"
                )}
              >
                <div className={cn(
                  "flex flex-col items-center transition-all duration-300",
                  gestureState.direction === 'OPPOSE' 
                    ? "scale-110 text-[--color-danger]" 
                    : "text-[--color-text-secondary]"
                )}>
                  <ThumbsDown className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Oppose</span>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            {gestureState.isActive && gestureState.direction && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[--color-border]">
                <div 
                  className={cn(
                    "h-full transition-all duration-100",
                    gestureState.direction === 'SUPPORT' 
                      ? "bg-[--color-success]" 
                      : "bg-[--color-danger]"
                  )}
                  style={{ width: `${gestureState.progress * 100}%` }}
                />
              </div>
            )}

            {/* Instructions */}
            {!gestureState.isActive && (
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="text-sm text-[--color-text-secondary]">
                  ← Swipe left to oppose • Swipe right to support →
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn("overflow-hidden", className)}>
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
          <div className={cn(
            "mb-6 p-4 border rounded-[--border-radius-lg] animate-[slideUp_0.3s_ease-out]",
            lastVote === 'SUPPORT' 
              ? "bg-[--color-success]/10 border-[--color-success]/20 text-[--color-success]"
              : "bg-[--color-danger]/10 border-[--color-danger]/20 text-[--color-danger]"
          )}>
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
            onClick={() => handleButtonVote('SUPPORT')}
            disabled={disabled || isVoting}
            className={cn(
              "flex-1 h-14 text-base font-medium transition-all duration-300 group",
              userVote === 'SUPPORT' 
                ? "bg-[--color-success] hover:bg-[--color-success-hover] text-white shadow-[--shadow-button]" 
                : "border-[--color-success] text-[--color-success] hover:bg-[--color-success]/10"
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
            onClick={() => handleButtonVote('OPPOSE')}
            disabled={disabled || isVoting}
            className={cn(
              "flex-1 h-14 text-base font-medium transition-all duration-300 group",
              userVote === 'OPPOSE' 
                ? "bg-[--color-danger] hover:bg-[--color-danger-hover] text-white shadow-[--shadow-button]" 
                : "border-[--color-danger] text-[--color-danger] hover:bg-[--color-danger]/10"
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