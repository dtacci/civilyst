'use client';

import { useState } from 'react';
import { Zap, Grid3X3, List } from 'lucide-react';
import { CampaignCard, CampaignCardData } from './CampaignCard';
import { SwipeVotingCard } from './SwipeVotingCard';
import { SectionErrorBoundary } from '~/components/error';
import { cn } from '~/lib/utils';

export interface EnhancedCampaignListProps {
  campaigns: CampaignCardData[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onVote?: (campaignId: string, voteType: 'SUPPORT' | 'OPPOSE') => void;
  getUserVote?: (campaignId: string) => 'SUPPORT' | 'OPPOSE' | null;
  isVoting?: (campaignId: string) => boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  enableSwipeVoting?: boolean;
}

type ViewMode = 'grid' | 'list' | 'swipe';

export function EnhancedCampaignList({
  campaigns,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onVote,
  getUserVote,
  isVoting,
  emptyMessage = 'No campaigns found',
  emptyDescription = 'Be the first to create a campaign in your area!',
  enableSwipeVoting = true,
}: EnhancedCampaignListProps) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(
    enableSwipeVoting ? 'swipe' : 'grid'
  );
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});

  const handleLoadMore = async () => {
    if (!onLoadMore || loadingMore) return;

    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  const handleVote = async (
    campaignId: string,
    voteType: 'SUPPORT' | 'OPPOSE'
  ) => {
    if (!onVote || votingStates[campaignId]) return;

    setVotingStates((prev) => ({ ...prev, [campaignId]: true }));

    try {
      await onVote(campaignId, voteType);
    } finally {
      setVotingStates((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  const getVotingState = (campaignId: string) => {
    return (
      votingStates[campaignId] || (isVoting && isVoting(campaignId)) || false
    );
  };

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="space-y-4">
        {/* Loading skeletons */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-slate-200 rounded-lg w-3/4 mb-3"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-slate-200 rounded-full w-16"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                <div className="h-4 bg-slate-200 rounded w-4/6"></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-slate-200 rounded-full mr-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-slate-200 rounded w-12"></div>
                  <div className="h-4 bg-slate-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-3">
          {emptyMessage}
        </h3>
        <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
          {emptyDescription}
        </p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
          Create Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-slate-900">Campaign Feed</h2>
          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-medium">
            {campaigns.length} campaigns
          </span>
        </div>

        <div className="flex items-center gap-2">
          {enableSwipeVoting && (
            <button
              onClick={() => setViewMode('swipe')}
              className={cn(
                'p-2 rounded-lg transition-all duration-200',
                viewMode === 'swipe'
                  ? 'bg-blue-100 text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              )}
              title="Swipe to Vote"
            >
              <Zap className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-all duration-200',
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            )}
            title="Grid View"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-all duration-200',
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            )}
            title="List View"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Swipe Instructions Banner */}
      {viewMode === 'swipe' && enableSwipeVoting && (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Swipe to Vote</h3>
              <p className="text-sm text-slate-600">
                Swipe right to support campaigns, left to oppose. Quick swipes
                count too!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Content */}
      <div
        className={cn(
          'space-y-4',
          viewMode === 'grid' &&
            'grid gap-6 md:grid-cols-2 lg:grid-cols-3 space-y-0',
          viewMode === 'list' && 'space-y-3'
        )}
      >
        {campaigns.map((campaign) => (
          <SectionErrorBoundary
            key={campaign.id}
            fallback={
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 text-sm font-medium">
                  Failed to load campaign
                </p>
                <p className="text-red-500 text-xs mt-1">
                  Please refresh to try again
                </p>
              </div>
            }
          >
            {viewMode === 'swipe' && enableSwipeVoting && onVote ? (
              <SwipeVotingCard
                campaign={campaign}
                onVote={handleVote}
                userVote={getUserVote?.(campaign.id)}
                isVoting={getVotingState(campaign.id)}
              />
            ) : (
              <CampaignCard
                campaign={campaign}
                compact={viewMode === 'list'}
                className={viewMode === 'list' ? 'max-w-none' : undefined}
              />
            )}
          </SectionErrorBoundary>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-slate-100 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {loadingMore ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-700 mr-3"></div>
                Loading more campaigns...
              </div>
            ) : (
              'Load More Campaigns'
            )}
          </button>
        </div>
      )}

      {/* Loading indicator for load more */}
      {loadingMore && (
        <div
          className={cn(
            'space-y-4',
            viewMode === 'grid' &&
              'grid gap-6 md:grid-cols-2 lg:grid-cols-3 space-y-0'
          )}
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
              <div className="animate-pulse">
                <div className="h-6 bg-slate-200 rounded-lg w-3/4 mb-4"></div>
                <div className="space-y-3 mb-4">
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Stats (for development) */}
      {process.env.NODE_ENV === 'development' && viewMode === 'swipe' && (
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Enhanced Touch-Optimized Voting Interface Active •{' '}
            {campaigns.length} campaigns loaded
          </p>
        </div>
      )}
    </div>
  );
}
