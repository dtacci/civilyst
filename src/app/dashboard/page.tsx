'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '~/lib/trpc';
import { CampaignStatus } from '~/generated/prisma';
import { PushNotificationSettings } from '~/components/pwa';

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ALL'>(
    'ALL'
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user's campaigns with optional status filter
  const { data, isLoading, refetch } = api.campaigns.getMyCampaigns.useQuery({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    limit: 50,
  });

  // Update campaign status mutation
  const updateCampaign = api.campaigns.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsUpdating(false);
    },
    onError: (error) => {
      console.error('Failed to update campaign:', error);
      alert('Failed to update campaign status. Please try again.');
      setIsUpdating(false);
    },
  });

  // Handle status change
  const handleStatusChange = async (
    campaignId: string,
    newStatus: CampaignStatus
  ) => {
    if (isUpdating) return;

    setIsUpdating(true);
    await updateCampaign.mutateAsync({
      id: campaignId,
      status: newStatus,
    });
  };

  // Calculate analytics
  const campaigns = data?.campaigns || [];
  const analytics = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'ACTIVE').length,
    draft: campaigns.filter((c) => c.status === 'DRAFT').length,
    completed: campaigns.filter((c) => c.status === 'COMPLETED').length,
    cancelled: campaigns.filter((c) => c.status === 'CANCELLED').length,
    totalVotes: campaigns.reduce(
      (sum, campaign) => sum + (campaign._count?.votes || 0),
      0
    ),
    totalComments: campaigns.reduce(
      (sum, campaign) => sum + (campaign._count?.comments || 0),
      0
    ),
  };

  return (
    <div className="min-h-screen bg-[--color-background]">
      {/* Header */}
      <div className="bg-[--color-surface] border-b border-[--color-border]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[--color-text-primary]">
                Campaign Dashboard
              </h1>
              <p className="mt-2 text-[--color-text-secondary]">
                Manage your campaigns and track their performance
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/campaigns/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-[--font-size-base] font-medium rounded-[--border-radius-lg] text-white bg-[--color-primary] hover:bg-[--color-primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-primary] transition-colors"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Campaign
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[--color-surface] p-6 rounded-[--border-radius-lg] shadow-sm border border-[--color-border]">
            <div className="text-[--font-size-sm] font-medium text-[--color-text-tertiary]">
              Total Campaigns
            </div>
            <div className="mt-1 text-3xl font-semibold text-[--color-text-primary]">
              {analytics.total}
            </div>
          </div>
          <div className="bg-[--color-surface] p-6 rounded-[--border-radius-lg] shadow-sm border border-[--color-border]">
            <div className="text-[--font-size-sm] font-medium text-[--color-text-tertiary]">
              Active Campaigns
            </div>
            <div className="mt-1 text-3xl font-semibold text-[--color-accent]">
              {analytics.active}
            </div>
          </div>
          <div className="bg-[--color-surface] p-6 rounded-[--border-radius-lg] shadow-sm border border-[--color-border]">
            <div className="text-[--font-size-sm] font-medium text-[--color-text-tertiary]">
              Total Votes
            </div>
            <div className="mt-1 text-3xl font-semibold text-[--color-primary]">
              {analytics.totalVotes}
            </div>
          </div>
          <div className="bg-[--color-surface] p-6 rounded-[--border-radius-lg] shadow-sm border border-[--color-border]">
            <div className="text-[--font-size-sm] font-medium text-[--color-text-tertiary]">
              Total Comments
            </div>
            <div className="mt-1 text-3xl font-semibold text-[--color-secondary]">
              {analytics.totalComments}
            </div>
          </div>
        </div>
      </div>

      {/* Push Notification Settings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <PushNotificationSettings className="mb-6" />
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-[--color-surface] p-6 rounded-[--border-radius-lg] shadow-sm border border-[--color-border]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-[--color-text-primary]">
              Your Campaigns
            </h2>
            <div className="mt-3 sm:mt-0">
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as CampaignStatus | 'ALL')
                }
                className="block w-full sm:w-auto px-3 py-2 border border-[--color-border] rounded-md shadow-sm focus:outline-none focus:ring-[--color-primary] focus:border-[--color-primary] text-[--font-size-base]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="space-y-6">
            {/* Loading skeleton for campaign table */}
            <div className="bg-[--color-surface] rounded-[--border-radius-lg] shadow-sm border border-[--color-border] overflow-hidden">
              <div className="px-6 py-4 border-b border-[--color-border]">
                <div className="h-6 bg-[--color-surface] rounded w-32 animate-pulse"></div>
              </div>
              <div className="divide-y divide-[--color-border]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-[--color-surface] rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-[--color-surface] rounded w-32 animate-pulse"></div>
                      </div>
                      <div className="flex space-x-4">
                        <div className="h-6 bg-[--color-surface] rounded-full w-16 animate-pulse"></div>
                        <div className="h-4 bg-[--color-surface] rounded w-12 animate-pulse"></div>
                        <div className="h-4 bg-[--color-surface] rounded w-12 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-[--color-surface] p-12 rounded-[--border-radius-lg] shadow-sm border border-[--color-border] text-center">
            {/* Empty state illustration placeholder */}
            <div className="w-24 h-24 mx-auto mb-6 bg-[--color-surface] rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-[--color-primary]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-[--color-text-primary] mb-3">
              {statusFilter !== 'ALL'
                ? `No ${statusFilter.toLowerCase()} campaigns found`
                : 'Ready to make a difference?'}
            </h3>
            <p className="text-[--color-text-secondary] mb-8 max-w-md mx-auto leading-relaxed">
              {statusFilter !== 'ALL'
                ? `You don't have any ${statusFilter.toLowerCase()} campaigns yet. Try changing the filter or create a new campaign.`
                : 'Your dashboard is waiting for your first campaign. Share your ideas with your community and start building support for the changes you want to see.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/campaigns/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-[--font-size-base] font-medium rounded-[--border-radius-lg] text-white bg-[--color-primary] hover:bg-[--color-primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-primary] transition-colors"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Campaign
              </Link>

              {statusFilter !== 'ALL' && (
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="inline-flex items-center px-6 py-3 border border-[--color-border] text-[--font-size-base] font-medium rounded-[--border-radius-lg] text-[--color-text-primary] bg-[--color-surface] hover:bg-[--color-surface-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--color-primary] transition-colors"
                >
                  View All Campaigns
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-[--color-surface] shadow-sm border border-[--color-border] sm:rounded-[--border-radius-lg]">
            <table className="min-w-full divide-y divide-[--color-border]">
              <thead className="bg-[--color-surface]">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wider"
                  >
                    Campaign
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wider"
                  >
                    Engagement
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-[--color-text-tertiary] uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[--color-surface] divide-y divide-[--color-border]">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-[--color-text-primary]">
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="hover:text-[--color-primary-hover]"
                            >
                              {campaign.title}
                            </Link>
                          </div>
                          <div className="text-sm text-[--color-text-secondary]">
                            Created {campaign.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[--color-text-primary]">
                        {campaign.city || 'N/A'}
                      </div>
                      <div className="text-sm text-[--color-text-secondary]">
                        {campaign.state || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={campaign.status}
                        onChange={(e) =>
                          handleStatusChange(
                            campaign.id,
                            e.target.value as CampaignStatus
                          )
                        }
                        disabled={isUpdating}
                        className={`text-sm rounded-full px-3 py-1 font-medium ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-[--color-accent] text-[--color-accent-text]'
                            : campaign.status === 'DRAFT'
                              ? 'bg-[--color-surface-hover] text-[--color-surface-hover-text]'
                              : campaign.status === 'COMPLETED'
                                ? 'bg-[--color-primary] text-[--color-primary-text]'
                                : 'bg-[--color-surface] text-[--color-surface-text]'
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-4">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-[--color-primary] mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-sm text-[--color-text-primary]">
                            {campaign._count?.votes || 0}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-[--color-secondary] mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-[--color-text-primary]">
                            {campaign._count?.comments || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[--color-text-secondary]">
                      <div className="flex space-x-2">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="text-[--color-primary] hover:text-[--color-primary-hover]"
                        >
                          View
                        </Link>
                        <Link
                          href={`/campaigns/${campaign.id}/edit`}
                          className="text-[--color-secondary] hover:text-[--color-secondary-hover]"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
