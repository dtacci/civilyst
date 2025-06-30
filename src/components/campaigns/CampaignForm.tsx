'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
  imageUrls?: string[];
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
  /* ------------------------------------------------------------------ */
  /* React Hook Form + Zod validation                                  */
  /* ------------------------------------------------------------------ */
  const schema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE']),
    imageUrls: z.array(z.string().url()).max(5).optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      latitude: initialData?.latitude,
      longitude: initialData?.longitude,
      address: initialData?.address ?? '',
      city: initialData?.city ?? '',
      state: initialData?.state ?? '',
      zipCode: initialData?.zipCode ?? '',
      status: initialData?.status ?? 'DRAFT',
      imageUrls: initialData?.imageUrls ?? [],
    },
  });

  const handleLocationChange = (location: GeocodeResult) => {
    setValue('latitude', location.latitude);
    setValue('longitude', location.longitude);
    setValue('address', location.address);
    setValue('city', location.city || '');
    setValue('state', location.state || '');
    setValue('zipCode', location.zipCode || '');
  };

  // When form is successfully submitted via RHF
  const onSubmitForm = (data: FormValues) => {
    onSubmit(data as CampaignFormData);
  };

  // live watch for char count
  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  // Current location values from the form
  const watchedLatitude = watch('latitude');
  const watchedLongitude = watch('longitude');
  const watchedAddress = watch('address');
  const watchedImages = watch('imageUrls');

  /* --------------------------- Uploadthing -------------------------- */
  // Dynamically import to avoid SSR issues (and satisfy ESLint)
  const [UploadButton, setUploadButton] = useState<
    typeof import('@uploadthing/react').UploadButton | null
  >(null);

  useEffect(() => {
    // Only runs on the client
    import('@uploadthing/react').then((m) =>
      setUploadButton(() => m.UploadButton)
    );
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
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
          {...register('title')}
          placeholder="Enter a clear, descriptive title for your campaign"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={200}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {watchedTitle?.length ?? 0}/200 characters
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
          {...register('description')}
          placeholder="Describe your campaign in detail. What are you proposing? Why is it important? How will it benefit the community?"
          rows={6}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={5000}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {watchedDescription?.length ?? 0}/5000 characters
        </p>
      </div>

      {/* Image Uploads */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Images (up to 5)
        </label>
        {UploadButton ? (
          <UploadButton
            endpoint="campaignImageUploader"
            onClientUploadComplete={(res) => {
              const urls = res.map((r) => r.fileUrl);
              setValue('imageUrls', urls);
            }}
            onUploadError={(err) => {
              console.error('Image upload error:', err);
              alert('Image upload failed, please try again.');
            }}
            appearance={{
              button:
                'ut-ready:border-blue-600 ut-ready:bg-blue-600 ut-uploading:cursor-not-allowed rounded-lg bg-blue-600 py-2 px-3 text-white text-sm font-medium hover:bg-blue-700 transition-colors',
              container: 'flex items-center',
              allowedContent: 'text-gray-500 text-xs mt-1',
            }}
          />
        ) : (
          <p className="text-sm text-gray-500">Loading uploader…</p>
        )}
        {watchedImages && watchedImages.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {watchedImages.map((url) => (
              <img
                key={url}
                src={url}
                alt="campaign upload preview"
                className="h-24 w-full object-cover rounded-lg border"
              />
            ))}
          </div>
        )}
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
            watchedLatitude !== undefined && watchedLongitude !== undefined
              ? {
                  latitude: watchedLatitude,
                  longitude: watchedLongitude,
                  address: watchedAddress,
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
          {...register('status')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="DRAFT">Draft - Save for later editing</option>
          <option value="ACTIVE">
            Active - Publish for community engagement
          </option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {watch('status') === 'DRAFT'
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
              {watch('status') === 'DRAFT'
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
