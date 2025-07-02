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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Campaign Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your campaigns and track their performance
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href="/campaigns/create"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">
              Total Campaigns
            </div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {analytics.total}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">
              Active Campaigns
            </div>
            <div className="mt-1 text-3xl font-semibold text-green-600">
              {analytics.active}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">Total Votes</div>
            <div className="mt-1 text-3xl font-semibold text-blue-600">
              {analytics.totalVotes}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500">
              Total Comments
            </div>
            <div className="mt-1 text-3xl font-semibold text-purple-600">
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900">
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
                className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-500 mb-6">
              {statusFilter !== 'ALL'
                ? `You don't have any ${statusFilter.toLowerCase()} campaigns.`
                : "You haven't created any campaigns yet."}
            </p>
            <Link
              href="/campaigns/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Campaign
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden bg-white shadow-sm border border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Campaign
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Location
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Engagement
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <Link
                              href={`/campaigns/${campaign.id}`}
                              className="hover:text-blue-600"
                            >
                              {campaign.title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            Created{' '}
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {campaign.city || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
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
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : campaign.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
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
                            className="w-4 h-4 text-blue-500 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span className="text-sm text-gray-900">
                            {campaign._count?.votes || 0}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-purple-500 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-gray-900">
                            {campaign._count?.comments || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/campaigns/${campaign.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
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
