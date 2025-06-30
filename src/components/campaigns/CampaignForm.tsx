'use client';

import { useState } from 'react';
import { LocationPicker } from '~/components/map';
import { GeocodeResult } from '~/lib/geocoding';

export interface CampaignFormData {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'DRAFT' | 'ACTIVE';
}

export interface CampaignFormProps {
  initialData?: Partial<CampaignFormData>;
  onSubmit: (data: CampaignFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CampaignForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Create Campaign',
}: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zipCode: initialData?.zipCode || '',
    status: initialData?.status || 'DRAFT',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be 5000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationChange = (location: GeocodeResult) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      city: location.city || '',
      state: location.state || '',
      zipCode: location.zipCode || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campaign Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Campaign Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter a clear, descriptive title for your campaign"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={200}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.title.length}/200 characters
        </p>
      </div>

      {/* Campaign Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your campaign in detail. What are you proposing? Why is it important? How will it benefit the community?"
          rows={6}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={5000}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/5000 characters
        </p>
      </div>

      {/* Location Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Location
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Select the location where this campaign is focused. This helps
          community members find relevant local projects.
        </p>
        <LocationPicker
          onLocationChange={handleLocationChange}
          initialLocation={
            formData.latitude && formData.longitude
              ? {
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                  address: formData.address,
                }
              : undefined
          }
        />
      </div>

      {/* Campaign Status */}
      <div>
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) =>
            handleInputChange('status', e.target.value as 'DRAFT' | 'ACTIVE')
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="DRAFT">Draft - Save for later editing</option>
          <option value="ACTIVE">
            Active - Publish for community engagement
          </option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {formData.status === 'DRAFT'
            ? 'Campaign will be saved but not visible to the public'
            : 'Campaign will be published and visible to the community'}
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {formData.status === 'DRAFT'
                ? 'Saving Draft...'
                : 'Publishing...'}
            </div>
          ) : (
            submitLabel
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">
          Tips for a successful campaign:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use a clear, specific title that describes your proposal</li>
          <li>• Explain the problem and your proposed solution</li>
          <li>• Include how the community will benefit</li>
          <li>• Be specific about the location and scope</li>
          <li>• Save as draft to get feedback before publishing</li>
        </ul>
      </div>
    </form>
  );
}
