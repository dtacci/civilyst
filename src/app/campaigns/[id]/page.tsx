'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import { CommentsSection } from '~/components/comments';
import { useCampaignOperations } from '~/hooks/use-campaign-operations';
import { VotingInterface } from '~/components/features/voting/voting-interface';
import { MobileNav } from '~/components/features/navigation/mobile-nav';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { SocialShare } from '~/components/features/sharing/social-share';
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Eye,
  Share,
  Bookmark,
  MoreVertical,
  Users,
  Activity,
} from 'lucide-react';
import { cn } from '~/lib/utils';
import Image from 'next/image';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [userVote, setUserVote] = useState<'SUPPORT' | 'OPPOSE' | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'gesture'>('default');
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: campaign, isLoading } = api.campaigns.getById.useQuery({ id });

  // Use the new optimistic operations hook
  const { voteCampaign, isVoting, voteError } = useCampaignOperations();

  const handleVote = (voteType: 'SUPPORT' | 'OPPOSE') => {
    if (userVote === voteType) {
      // If clicking the same vote, don't do anything for now
      // In real implementation, you might want to allow removing votes
      return;
    }

    // Use optimistic voting mutation
    voteCampaign.mutate(
      {
        campaignId: id,
        voteType,
      },
      {
        onSuccess: (result) => {
          // Update local state to match the server result
          setUserVote(result.voteType);
        },
        onError: (error) => {
          // Error handling with user feedback
          alert('Failed to vote. Please try again.');
          console.error('Vote error:', error);
        },
      }
    );
  };

  // Show error message if voting fails
  if (voteError) {
    console.error('Voting error:', voteError);
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'COMPLETED':
        return 'primary';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--color-background]">
        <MobileNav />
        <div className="mobile-container py-8">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-10 w-10 bg-[--color-border] rounded-[--border-radius-full]"></div>
              <div className="h-6 bg-[--color-border] rounded w-24"></div>
            </div>

            {/* Content skeleton */}
            <Card>
              <CardContent className="p-6">
                <div className="h-8 bg-[--color-border] rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-[--color-border] rounded w-1/2 mb-6"></div>
                <div className="space-y-3 mb-8">
                  <div className="h-4 bg-[--color-border] rounded w-full"></div>
                  <div className="h-4 bg-[--color-border] rounded w-5/6"></div>
                  <div className="h-4 bg-[--color-border] rounded w-4/6"></div>
                </div>
                <div className="h-32 bg-[--color-border] rounded-[--border-radius-lg]"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[--color-background]">
        <MobileNav />
        <div className="mobile-container">
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card variant="outline" className="max-w-md">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-[--color-danger]/10 rounded-[--border-radius-full] flex items-center justify-center mx-auto mb-4">
                  <Eye className="h-8 w-8 text-[--color-danger]" />
                </div>
                <h1 className="text-xl font-semibold text-[--color-text-primary] mb-2">
                  Campaign Not Found
                </h1>
                <p className="text-[--color-text-secondary] mb-6">
                  The campaign you&apos;re looking for doesn&apos;t exist or has
                  been removed.
                </p>
                <Button
                  onClick={() => router.push('/campaigns')}
                  className="w-full"
                >
                  Browse Campaigns
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Get the current vote count
  const currentVoteCount = campaign._count?.votes || 0;

  return (
    <div className="min-h-screen bg-[--color-background]">
      <MobileNav />

      {/* Mobile-First Header */}
      <div className="sticky top-0 z-[--z-sticky] bg-[--color-surface]/95 backdrop-blur-md border-b border-[--color-border] safe-area-top">
        <div className="mobile-container">
          <div className="flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-[--color-text-secondary] hover:text-[--color-text-primary]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowShareModal(true)}
                className="relative"
              >
                <Share className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bookmark className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-container py-6 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <Card
            variant={getStatusVariant(campaign.status)}
            className="inline-flex px-3 py-1.5"
          >
            <span className="text-sm font-medium">{campaign.status}</span>
          </Card>
          <div className="flex items-center gap-2 text-[--color-text-secondary]">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {formatDistanceToNow(campaign.createdAt, { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Campaign Content */}
        <Card variant="elevated">
          <CardContent className="p-6 space-y-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-[--color-text-primary] leading-tight">
              {campaign.title}
            </h1>

            {/* Creator Info */}
            <div className="flex items-center gap-3 p-4 bg-[--color-surface] rounded-[--border-radius-lg]">
              {campaign.creator?.imageUrl ? (
                <Image
                  src={campaign.creator.imageUrl}
                  alt={`${campaign.creator.firstName} ${campaign.creator.lastName}`}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-[--border-radius-full] object-cover"
                  priority={false}
                />
              ) : (
                <div className="w-12 h-12 rounded-[--border-radius-full] bg-[--color-primary]/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-[--color-primary]" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium text-[--color-text-primary]">
                  {campaign.creator?.firstName} {campaign.creator?.lastName}
                </div>
                <div className="text-sm text-[--color-text-secondary]">
                  Campaign Creator
                </div>
              </div>
              <div className="flex items-center gap-1 text-[--color-text-secondary]">
                <Users className="h-4 w-4" />
                <span className="text-sm">{currentVoteCount}</span>
              </div>
            </div>

            {/* Location */}
            {campaign.address && (
              <div className="flex items-center gap-2 p-3 bg-[--color-accent]/5 rounded-[--border-radius-lg] border border-[--color-accent]/20">
                <MapPin className="h-5 w-5 text-[--color-accent] flex-shrink-0" />
                <span className="text-[--color-text-primary] text-sm">
                  {campaign.address}
                </span>
              </div>
            )}

            {/* Description */}
            <div className="prose max-w-none">
              <p className="text-[--color-text-primary] leading-relaxed whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center justify-between p-4 bg-[--color-surface] rounded-[--border-radius-lg] border border-[--color-border]">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[--color-primary]" />
                <span className="text-sm font-medium text-[--color-text-primary]">
                  Active Campaign
                </span>
              </div>
              <Button
                variant={viewMode === 'gesture' ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === 'gesture' ? 'default' : 'gesture')
                }
              >
                {viewMode === 'gesture' ? 'Button Mode' : 'Gesture Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Revolutionary Voting Interface */}
        {campaign.status === 'ACTIVE' && (
          <VotingInterface
            campaignId={id}
            currentVoteCount={currentVoteCount}
            userVote={userVote}
            isVoting={isVoting}
            onVote={handleVote}
            variant={viewMode}
            disabled={false}
            className={cn(
              'transition-all duration-500',
              viewMode === 'gesture' &&
                'bg-gradient-to-r from-[--color-primary]/5 to-[--color-success]/5'
            )}
          />
        )}

        {/* Comments Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[--color-text-primary]">
              Community Discussion
            </h2>
            <div className="h-px flex-1 bg-[--color-border]"></div>
          </div>

          <CommentsSection
            campaignId={id}
            currentUserId="mock_user_id" // TODO: Replace with actual user ID from auth
          />
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className="safe-area-bottom h-6"></div>

      {/* Revolutionary Social Share Modal */}
      {campaign && showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-[--z-modal] flex items-end justify-center p-4">
          <div className="w-full max-w-md">
            <SocialShare
              data={{
                id: campaign.id,
                title: campaign.title,
                description: campaign.description,
                url: `${typeof window !== 'undefined' ? window.location.origin : ''}/campaigns/${campaign.id}`,
                imageUrl: campaign.imageUrl || undefined,
                tags: ['civic-engagement', campaign.status.toLowerCase()],
                location: campaign.address || undefined,
                voteCount: currentVoteCount,
                creatorName:
                  `${campaign.creator?.firstName} ${campaign.creator?.lastName}` ||
                  'Unknown Creator',
              }}
              variant="default"
              className="bg-[--color-surface-elevated] rounded-t-[--border-radius-xl] shadow-[--shadow-modal]"
            />
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-transparent"
              aria-label="Close sharing options"
            />
          </div>
        </div>
      )}
    </div>
  );
}
