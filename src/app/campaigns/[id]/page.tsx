'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import { CommentsSection } from '~/components/comments';
import { useCampaignOperations } from '~/hooks/use-campaign-operations';
import Image from 'next/image';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

// Extended campaign type to include optimistic user vote data
interface CampaignWithUserVote {
  userVote?: 'SUPPORT' | 'OPPOSE';
}

export default function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [userVote, setUserVote] = useState<'SUPPORT' | 'OPPOSE' | null>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
              <div className="space-y-3 mb-8">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-4/6"></div>
              </div>
              <div className="h-64 bg-gray-300 rounded mb-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Campaign Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The campaign you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <button
            onClick={() => router.push('/campaigns')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Campaigns
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the current vote count, using optimistic update if available
  const campaignWithOptimisticData = campaign as typeof campaign &
    CampaignWithUserVote;
  const currentVoteCount = campaign._count?.votes || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  campaign.status
                )}`}
              >
                {campaign.status}
              </span>
              <span className="text-sm text-gray-500">
                Created{' '}
                {formatDistanceToNow(campaign.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            {/* Title and Creator */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {campaign.title}
            </h1>

            {/* Creator Info */}
            <div className="flex items-center mb-6">
              {campaign.creator?.imageUrl ? (
                <Image
                  src={campaign.creator.imageUrl}
                  alt={`${campaign.creator.firstName} ${campaign.creator.lastName}`}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full mr-3"
                  priority={false}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {campaign.creator?.firstName} {campaign.creator?.lastName}
                </div>
                <div className="text-sm text-gray-500">Campaign Creator</div>
              </div>
            </div>

            {/* Location */}
            {campaign.address && (
              <div className="flex items-center text-gray-600 mb-6">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{campaign.address}</span>
              </div>
            )}

            {/* Description */}
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>

            {/* Voting Section with Optimistic Updates */}
            {campaign.status === 'ACTIVE' && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Support this campaign
                </h3>

                {/* Show optimistic voting feedback */}
                {isVoting && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-800"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting your vote...
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleVote('SUPPORT')}
                    disabled={isVoting}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      userVote === 'SUPPORT' ||
                      campaignWithOptimisticData?.userVote === 'SUPPORT'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V6a2 2 0 012-2h2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        />
                      </svg>
                      Support ({currentVoteCount})
                    </div>
                  </button>

                  <button
                    onClick={() => handleVote('OPPOSE')}
                    disabled={isVoting}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      userVote === 'OPPOSE' ||
                      campaignWithOptimisticData?.userVote === 'OPPOSE'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 13l3 3 7-7"
                        />
                      </svg>
                      Oppose
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection
          campaignId={id}
          currentUserId="mock_user_id" // TODO: Replace with actual user ID from auth
        />
      </div>
    </div>
  );
}
