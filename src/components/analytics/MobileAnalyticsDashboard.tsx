'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  HandThumbUpIcon,
  ChatBubbleBottomCenterTextIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  MapPinIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { MobileAnalyticsCard } from './MobileAnalyticsCard';

interface CampaignAnalytics {
  total: number;
  active: number;
  draft: number;
  completed: number;
  cancelled: number;
  totalVotes: number;
  totalComments: number;
  totalViews?: number;
  engagementRate?: number;
  averageVotesPerCampaign?: number;
  topPerformingCampaign?: {
    title: string;
    votes: number;
  };
  recentActivity?: {
    period: string;
    change: number;
    positive: boolean;
  };
  geographicReach?: {
    cities: number;
    states: number;
  };
}

interface MobileAnalyticsDashboardProps {
  analytics: CampaignAnalytics;
  onCardClick?: (cardType: string) => void;
  className?: string;
}

export function MobileAnalyticsDashboard({
  analytics,
  onCardClick,
  className = '',
}: MobileAnalyticsDashboardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Staggered animation entrance
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const calculateEngagementRate = () => {
    if (!analytics.totalViews || analytics.totalViews === 0) return 0;
    return Math.round(
      ((analytics.totalVotes + analytics.totalComments) /
        analytics.totalViews) *
        100
    );
  };

  const analyticsCards = [
    {
      id: 'campaigns',
      title: 'Total Campaigns',
      value: analytics.total,
      subtitle: 'campaigns',
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'primary' as const,
      trend: analytics.recentActivity
        ? {
            value: analytics.recentActivity.change,
            label: `vs ${analytics.recentActivity.period}`,
            positive: analytics.recentActivity.positive,
          }
        : undefined,
    },
    {
      id: 'active',
      title: 'Active Campaigns',
      value: analytics.active,
      subtitle: 'running',
      icon: <ArrowTrendingUpIcon className="w-6 h-6" />,
      color: 'accent' as const,
      trend:
        analytics.total > 0
          ? {
              value: Math.round((analytics.active / analytics.total) * 100),
              label: 'of total',
              positive: analytics.active > 0,
            }
          : undefined,
    },
    {
      id: 'votes',
      title: 'Total Votes',
      value: formatNumber(analytics.totalVotes),
      subtitle: 'votes cast',
      icon: <HandThumbUpIcon className="w-6 h-6" />,
      color: 'secondary' as const,
      trend: analytics.averageVotesPerCampaign
        ? {
            value: Math.round(analytics.averageVotesPerCampaign),
            label: 'avg per campaign',
            positive: analytics.averageVotesPerCampaign > 10,
          }
        : undefined,
    },
    {
      id: 'comments',
      title: 'Community Engagement',
      value: formatNumber(analytics.totalComments),
      subtitle: 'comments',
      icon: <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />,
      color: 'warning' as const,
      trend: analytics.engagementRate
        ? {
            value: analytics.engagementRate,
            label: 'engagement rate',
            positive: analytics.engagementRate > 5,
          }
        : undefined,
    },
  ];

  // Additional cards for enhanced analytics
  const enhancedCards = [
    ...(analytics.totalViews
      ? [
          {
            id: 'views',
            title: 'Campaign Views',
            value: formatNumber(analytics.totalViews),
            subtitle: 'total views',
            icon: <EyeIcon className="w-6 h-6" />,
            color: 'primary' as const,
            trend: {
              value: calculateEngagementRate(),
              label: 'engagement rate',
              positive: calculateEngagementRate() > 5,
            },
          },
        ]
      : []),
    ...(analytics.geographicReach
      ? [
          {
            id: 'reach',
            title: 'Geographic Reach',
            value: analytics.geographicReach.cities,
            subtitle: `cities, ${analytics.geographicReach.states} states`,
            icon: <MapPinIcon className="w-6 h-6" />,
            color: 'accent' as const,
          },
        ]
      : []),
    ...(analytics.topPerformingCampaign
      ? [
          {
            id: 'top-campaign',
            title: 'Top Campaign',
            value: analytics.topPerformingCampaign.votes,
            subtitle: `votes on "${analytics.topPerformingCampaign.title.slice(0, 20)}..."`,
            icon: <UserGroupIcon className="w-6 h-6" />,
            color: 'secondary' as const,
          },
        ]
      : []),
  ];

  const allCards = [...analyticsCards, ...enhancedCards];

  return (
    <div className={`space-y-[--space-lg] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[--font-size-xl] font-bold text-[--color-text-primary]">
            Campaign Analytics
          </h2>
          <p className="text-[--font-size-sm] text-[--color-text-secondary] mt-[--space-xs]">
            Track your civic engagement impact
          </p>
        </div>
        <button
          onClick={() => onCardClick?.('refresh')}
          className="p-[--space-sm] rounded-[--border-radius-lg] bg-[--color-surface] border border-[--color-border] hover:bg-[--color-surface-elevated] transition-colors"
        >
          <ClockIcon className="w-5 h-5 text-[--color-text-secondary]" />
        </button>
      </div>

      {/* Analytics Grid */}
      <div
        className={`
        grid grid-cols-1 sm:grid-cols-2 gap-[--space-lg]
        transition-all duration-[--duration-slow] ease-[--ease-out]
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      >
        {allCards.map((card, index) => (
          <div
            key={card.id}
            className="transform transition-all duration-[--duration-normal] ease-[--ease-out]"
            style={{
              transitionDelay: `${index * 50}ms`,
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            <MobileAnalyticsCard
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              color={card.color}
              trend={card.trend}
              onClick={() => onCardClick?.(card.id)}
            />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-[--space-xl]">
        <div className="flex flex-wrap gap-[--space-sm]">
          <button
            onClick={() => onCardClick?.('create-campaign')}
            className="
              flex items-center px-[--space-lg] py-[--space-md] 
              bg-[--color-primary] text-[--color-text-inverse] 
              rounded-[--border-radius-lg] font-medium
              hover:bg-[--color-primary-hover] 
              active:scale-[0.98] transition-all duration-[--duration-fast]
              min-h-[--space-touch-target]
            "
          >
            <ChartBarIcon className="w-5 h-5 mr-[--space-sm]" />
            Create Campaign
          </button>

          <button
            onClick={() => onCardClick?.('detailed-analytics')}
            className="
              flex items-center px-[--space-lg] py-[--space-md] 
              bg-[--color-surface] text-[--color-text-primary] 
              border border-[--color-border] rounded-[--border-radius-lg] font-medium
              hover:bg-[--color-surface-elevated] 
              active:scale-[0.98] transition-all duration-[--duration-fast]
              min-h-[--space-touch-target]
            "
          >
            <ArrowTrendingUpIcon className="w-5 h-5 mr-[--space-sm]" />
            Detailed Analytics
          </button>
        </div>
      </div>

      {/* Empty State */}
      {analytics.total === 0 && (
        <div className="text-center py-[--space-3xl]">
          <ChartBarIcon className="w-16 h-16 text-[--color-text-tertiary] mx-auto mb-[--space-lg]" />
          <h3 className="text-[--font-size-lg] font-medium text-[--color-text-primary] mb-[--space-sm]">
            No campaigns yet
          </h3>
          <p className="text-[--font-size-sm] text-[--color-text-secondary] mb-[--space-xl] max-w-md mx-auto">
            Create your first campaign to start tracking engagement and building
            community support.
          </p>
          <button
            onClick={() => onCardClick?.('create-campaign')}
            className="
              inline-flex items-center px-[--space-xl] py-[--space-lg] 
              bg-[--color-primary] text-[--color-text-inverse] 
              rounded-[--border-radius-lg] font-medium
              hover:bg-[--color-primary-hover] 
              active:scale-[0.98] transition-all duration-[--duration-fast]
              min-h-[--space-touch-target]
            "
          >
            <ChartBarIcon className="w-5 h-5 mr-[--space-sm]" />
            Create Your First Campaign
          </button>
        </div>
      )}
    </div>
  );
}
