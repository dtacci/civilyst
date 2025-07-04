'use client';

import { useUser } from '@clerk/nextjs';
import { api } from '~/lib/trpc';
import { DailyWonder } from './DailyWonder';
import { WonderCard } from './WonderCard';
import { WonderStreak } from './WonderStreak';

export function WonderFeed() {
  const { user } = useUser();

  // Get active wonder and trending wonders
  const { data: activeWonder, isLoading: loadingActive } =
    api.wonders.getActiveWonder.useQuery();
  const { data: trendingWonders } = api.wonders.getTrendingWonders.useQuery({
    limit: 5,
  });
  const { data: userStats } = api.wonders.getUserWonderStats.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  if (loadingActive) {
    return <WonderFeedSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[--color-background]">
      {/* Header with greeting */}
      <div className="bg-[--color-surface] border-b border-[--color-border]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[--color-text-primary] mb-2">
              Good {getTimeOfDay()}, {user?.firstName || 'neighbor'}!
            </h1>
            <p className="text-[--color-text-secondary]">
              What&apos;s sparking your curiosity today?
            </p>
          </div>
        </div>
      </div>

      {/* User Stats / Streak */}
      {user && userStats && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <WonderStreak
            streak={userStats.streak}
            totalResponses={userStats.totalResponses}
            canAskWonders={userStats.canAskWonders}
            canSeePatterns={userStats.canSeePatterns}
          />
        </div>
      )}

      {/* Daily Wonder */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeWonder ? (
          <DailyWonder wonder={activeWonder} userStats={userStats} />
        ) : (
          <div className="bg-[--color-surface] rounded-[--border-radius-lg] p-8 text-center border border-[--color-border]">
            <div className="w-16 h-16 mx-auto mb-4 bg-[--color-surface-hover] rounded-full flex items-center justify-center">
              <span className="text-2xl">🤔</span>
            </div>
            <h3 className="text-lg font-semibold text-[--color-text-primary] mb-2">
              No active wonder today
            </h3>
            <p className="text-[--color-text-secondary] mb-4">
              Be the first to spark community imagination!
            </p>
            {userStats?.canAskWonders && (
              <button className="inline-flex items-center px-6 py-3 bg-[--color-primary] text-white rounded-[--border-radius-lg] font-medium hover:bg-[--color-primary-hover] transition-colors">
                <span className="mr-2">✨</span>
                Ask a Wonder
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trending Wonders */}
      {trendingWonders && trendingWonders.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[--color-text-primary]">
              🔥 Hot Wonders
            </h2>
            <button className="text-[--color-text-tertiary] hover:text-[--color-text-secondary] text-sm">
              View all
            </button>
          </div>

          <div className="space-y-3">
            {trendingWonders.map((wonder) => (
              <WonderCard
                key={wonder.id}
                wonder={wonder}
                showPattern={userStats?.canSeePatterns}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Your Own Wonder */}
      {userStats?.canAskWonders && (
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <div className="bg-gradient-to-r from-[--color-primary] to-[--color-secondary] rounded-[--border-radius-lg] p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              ✨ Ask your own wonder
            </h3>
            <p className="text-white/80 mb-4">
              What would you love to see in your community?
            </p>
            <button className="bg-white text-[--color-primary] px-6 py-3 rounded-[--border-radius-lg] font-medium hover:bg-gray-50 transition-colors">
              🎤 Hold to ask
            </button>
          </div>
        </div>
      )}

      {/* Map Toggle */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-[--color-surface] border border-[--color-border] p-4 rounded-full shadow-lg hover:shadow-xl transition-all">
          <svg
            className="w-6 h-6 text-[--color-text-primary]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

function WonderFeedSkeleton() {
  return (
    <div className="min-h-screen bg-[--color-background]">
      {/* Header skeleton */}
      <div className="bg-[--color-surface] border-b border-[--color-border]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center space-y-3">
            <div className="h-8 bg-[--color-surface-hover] rounded w-48 mx-auto animate-pulse"></div>
            <div className="h-5 bg-[--color-surface-hover] rounded w-64 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Wonder skeleton */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-[--color-surface] rounded-[--border-radius-lg] p-6 border border-[--color-border]">
          <div className="space-y-4">
            <div className="h-6 bg-[--color-surface-hover] rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-[--color-surface-hover] rounded w-1/2 animate-pulse"></div>
            <div className="h-16 bg-[--color-surface-hover] rounded-full w-16 mx-auto animate-pulse"></div>
            <div className="h-12 bg-[--color-surface-hover] rounded-[--border-radius-lg] w-32 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
