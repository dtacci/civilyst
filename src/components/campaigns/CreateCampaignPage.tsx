'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignForm, CampaignFormData } from './CampaignForm';
import { useCampaignOperations } from '~/hooks/use-campaign-operations';

export function CreateCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCampaign, isCreating } = useCampaignOperations();

  // Configure success/error handlers
  const handleCampaignCreated = (campaign: {
    id: string;
    title: string;
    status: string;
  }) => {
    console.warn('Campaign created successfully:', campaign);

    // Show success message (you could add toast notification here)
    alert(
      `Campaign "${campaign.title}" ${campaign.status === 'DRAFT' ? 'saved as draft' : 'published'} successfully!`
    );

    // Redirect to campaign detail page or campaigns list
    router.push(`/campaigns/${campaign.id}`);
  };

  const handleCampaignError = (error: unknown) => {
    console.error('Failed to create campaign:', error);
    alert('Failed to create campaign. Please try again.');
  };

  const handleSubmit = async (formData: CampaignFormData) => {
    setIsSubmitting(true);

    try {
      const campaign = await createCampaign.mutateAsync({
        title: formData.title,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        status: formData.status,
      });

      handleCampaignCreated(campaign);
    } catch (error) {
      handleCampaignError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (
      confirm('Are you sure you want to cancel? Your changes will be lost.')
    ) {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
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
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Campaign
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Start a campaign to engage your community around important local
            issues. Whether it&apos;s a new park, bike lanes, or community
            programs, your voice can make a difference.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <CampaignForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting || isCreating}
            submitLabel={
              isSubmitting || isCreating ? 'Creating...' : 'Create Campaign'
            }
          />
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How to create an effective campaign
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                📝 Clear Communication
              </h3>
              <p className="text-sm text-gray-600">
                Use simple, clear language to explain your proposal. Avoid
                jargon and focus on how the campaign benefits the community.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                📍 Specific Location
              </h3>
              <p className="text-sm text-gray-600">
                Be specific about where your campaign applies. This helps
                community members understand if it affects them directly.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                🎯 Define the Problem
              </h3>
              <p className="text-sm text-gray-600">
                Clearly explain the issue you&apos;re addressing and why it
                matters to the community. Use facts and examples when possible.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                💡 Propose Solutions
              </h3>
              <p className="text-sm text-gray-600">
                Don&apos;t just identify problems - offer concrete solutions or
                alternatives that the community can support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
