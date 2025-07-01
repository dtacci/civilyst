'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { CampaignStatus } from '~/generated/prisma';

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
}

export function CampaignCard({
  campaign,
  showLocation = true,
  showCreator = true,
  compact = false,
}: CampaignCardProps) {
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

  const truncateDescription = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const maxDescriptionLength = compact ? 120 : 200;

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden cursor-pointer">
        {/* Header */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                {campaign.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    campaign.status
                  )}`}
                >
                  {getStatusLabel(campaign.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(campaign.createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {truncateDescription(campaign.description, maxDescriptionLength)}
          </p>

          {/* Location */}
          {showLocation && (campaign.address || campaign.city) && (
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <svg
                className="w-4 h-4 mr-1 flex-shrink-0"
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
              <span className="truncate">
                {campaign.address ||
                  [campaign.city, campaign.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* Creator */}
            {showCreator && campaign.creator && (
              <div className="flex items-center text-sm text-gray-600">
                {campaign.creator.imageUrl ? (
                  <Image
                    src={campaign.creator.imageUrl}
                    alt={`${campaign.creator.firstName} ${campaign.creator.lastName}`}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full mr-2"
                    priority={false}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-gray-600"
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
                <span>
                  {campaign.creator.firstName} {campaign.creator.lastName}
                </span>
              </div>
            )}

            {/* Engagement Stats */}
            {campaign._count && (
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
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
                  <span>{campaign._count.votes}</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>{campaign._count.comments}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
