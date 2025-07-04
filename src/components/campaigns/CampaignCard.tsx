'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, User, ThumbsUp, MessageCircle } from 'lucide-react';
import { CampaignStatus } from '~/generated/prisma';
import { Card, CardContent } from '~/components/ui/card';
import { SocialShare } from '~/components/features/sharing/social-share';
import { cn } from '~/lib/utils';

export interface CampaignCardData {
  id: string;
  title: string;
  description: string;
  status: CampaignStatus;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: Date;
  creator?: {
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  };
  _count?: {
    votes: number;
    comments: number;
  };
}

export interface CampaignCardProps {
  campaign: CampaignCardData;
  showLocation?: boolean;
  showCreator?: boolean;
  compact?: boolean;
  className?: string;
}

export function CampaignCard({
  campaign,
  showLocation = true,
  showCreator = true,
  compact = false,
  className,
}: CampaignCardProps) {
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
      'inline-flex items-center px-3 py-1 rounded-[--border-radius-full] text-[--font-size-xs] font-medium transition-colors duration-[--duration-normal]';

    switch (status) {
      case 'ACTIVE':
        return cn(
          baseStyles,
          'bg-[--color-accent-light] text-[--color-accent] border border-[--color-accent]'
        );
      case 'DRAFT':
        return cn(
          baseStyles,
          'bg-[--color-warning-light] text-[--color-warning] border border-[--color-warning]'
        );
      case 'COMPLETED':
        return cn(
          baseStyles,
          'bg-[--color-primary-light] text-[--color-primary] border border-[--color-primary]'
        );
      case 'CANCELLED':
        return cn(
          baseStyles,
          'bg-[--color-danger-light] text-[--color-danger] border border-[--color-danger]'
        );
      default:
        return cn(
          baseStyles,
          'bg-[--color-surface] text-[--color-text-secondary] border border-[--color-border]'
        );
    }
  };

  const truncateDescription = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const maxDescriptionLength = compact ? 120 : 200;

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] focus-visible:ring-offset-2 rounded-[--border-radius-lg]"
    >
      <Card
        interactive
        ripple
        className={cn(
          'h-full transition-all duration-[--duration-normal]',
          'group-hover:shadow-[--shadow-elevated] group-hover:-translate-y-1',
          'group-active:translate-y-0 group-active:shadow-[--shadow-touch]',
          'border-[--color-border] bg-[--color-surface-elevated]',
          compact && 'p-3',
          className
        )}
        size={compact ? 'sm' : 'default'}
      >
        <CardContent
          className={cn('p-0 space-y-4', compact ? 'space-y-3' : 'space-y-4')}
        >
          {/* Header Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    'font-semibold text-[--color-text-primary] line-clamp-2 leading-[--line-height-tight]',
                    compact
                      ? 'text-[--font-size-base]'
                      : 'text-[--font-size-lg]'
                  )}
                >
                  {campaign.title}
                </h3>
              </div>
            </div>

            {/* Status and Time */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={getStatusStyles(campaign.status)}>
                {getStatusLabel(campaign.status)}
              </span>
              <span className="text-[--font-size-sm] text-[--color-text-tertiary]">
                {formatDistanceToNow(campaign.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Description */}
          <p
            className={cn(
              'text-[--color-text-secondary] leading-[--line-height-relaxed]',
              compact ? 'text-[--font-size-sm]' : 'text-[--font-size-base]'
            )}
          >
            {truncateDescription(campaign.description, maxDescriptionLength)}
          </p>

          {/* Location */}
          {showLocation && (campaign.address || campaign.city) && (
            <div className="flex items-center gap-2 text-[--font-size-sm] text-[--color-text-tertiary]">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {campaign.address ||
                  [campaign.city, campaign.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[--color-border] gap-3">
            {/* Creator */}
            {showCreator && campaign.creator && (
              <div className="flex items-center gap-2 text-[--font-size-sm] text-[--color-text-secondary] min-w-0 flex-1">
                {campaign.creator.imageUrl ? (
                  <Image
                    src={campaign.creator.imageUrl}
                    alt={`${campaign.creator.firstName} ${campaign.creator.lastName}`}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-[--border-radius-full] flex-shrink-0 object-cover"
                    priority={false}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-[--border-radius-full] bg-[--color-surface] border border-[--color-border] flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-[--color-text-tertiary]" />
                  </div>
                )}
                <span className="truncate">
                  {campaign.creator.firstName} {campaign.creator.lastName}
                </span>
              </div>
            )}

            {/* Engagement Stats */}
            {campaign._count && (
              <div className="flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4 text-[--font-size-sm] text-[--color-text-tertiary]">
                  <div className="flex items-center gap-1 touch-target">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="font-medium">{campaign._count.votes}</span>
                  </div>
                  <div className="flex items-center gap-1 touch-target">
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-medium">
                      {campaign._count.comments}
                    </span>
                  </div>
                </div>

                {/* Compact Social Share */}
                <div onClick={(e) => e.preventDefault()}>
                  <SocialShare
                    data={{
                      id: campaign.id,
                      title: campaign.title,
                      description: campaign.description,
                      url: `${typeof window !== 'undefined' ? window.location.origin : ''}/campaigns/${campaign.id}`,
                      location: campaign.address || undefined,
                      voteCount: campaign._count.votes,
                      creatorName: campaign.creator
                        ? `${campaign.creator.firstName} ${campaign.creator.lastName}`
                        : undefined,
                      tags: ['civic-engagement', campaign.status.toLowerCase()],
                    }}
                    variant="compact"
                    showAnalytics={false}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
