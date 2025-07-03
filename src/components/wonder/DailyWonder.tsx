'use client';

import { useState } from 'react';
import { api } from '~/lib/trpc';
import { VoiceRecorder } from './VoiceRecorder';

interface DailyWonderProps {
  wonder: {
    id: string;
    question: string;
    category: string;
    timeContext: string;
    responseCount: number;
    author?: {
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    } | null;
    _count: {
      responses: number;
    };
  };
  userStats?: {
    streak: number;
    totalResponses: number;
    canAskWonders: boolean;
    canSeePatterns: boolean;
  };
}

export function DailyWonder({ wonder, userStats }: DailyWonderProps) {
  const [hasResponded, setHasResponded] = useState(false);

  const answerMutation = api.wonders.answerWonder.useMutation({
    onSuccess: () => {
      setHasResponded(true);
    },
    onError: () => {
      console.error('Failed to submit response');
    },
  });

  const handleVoiceResponse = async (audioUrl?: string, textResponse?: string) => {
    try {
      await answerMutation.mutateAsync({
        wonderId: wonder.id,
        audioUrl,
        textResponse,
      });
    } catch {
      // Error handled in onError callback
    }
  };

  if (hasResponded) {
    return (
      <div className="bg-[--color-surface] rounded-[--border-radius-lg] p-6 border border-[--color-border]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
            Thanks for sharing!
          </h3>
          <p className="text-[--color-text-secondary] mb-4">
            Your voice has been added to the community conversation.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-[--color-text-tertiary]">
            <span>🔥 {wonder._count.responses + 1} responses</span>
            <span>•</span>
            <span>🚀 +{userStats?.streak || 0} day streak</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[--color-surface] rounded-[--border-radius-lg] p-6 border border-[--color-border]">
      {/* Wonder Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center px-3 py-1 bg-[--color-primary]/10 text-[--color-primary] rounded-full text-sm font-medium mb-4">
          <span className="mr-1">🤔</span>
          Today&apos;s Wonder
        </div>
        
        <h2 className="text-xl font-semibold text-[--color-text-primary] mb-2">
          {wonder.question}
        </h2>
        
        {wonder.author && (
          <p className="text-[--color-text-tertiary] text-sm">
            Asked by {wonder.author.firstName} {wonder.author.lastName}
          </p>
        )}
      </div>

      {/* Voice Recorder */}
      <div className="mb-6">
        <VoiceRecorder
          onResponse={handleVoiceResponse}
          isLoading={answerMutation.isPending}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center space-x-4 text-sm text-[--color-text-tertiary]">
        <span>🔥 {wonder._count.responses} responses</span>
        <span>•</span>
        <span>📍 {wonder.category.toLowerCase()}</span>
        {wonder.timeContext && wonder.timeContext !== 'ANYTIME' && (
          <>
            <span>•</span>
            <span>⏰ {wonder.timeContext.toLowerCase()}</span>
          </>
        )}
      </div>
    </div>
  );
} 