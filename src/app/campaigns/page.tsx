'use client';

import { CampaignDiscoveryMap } from '~/components/map/CampaignDiscoveryMap';
import { AsyncBoundary } from '~/components/error';

export default function CampaignsPage() {
  return (
    <AsyncBoundary
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns map...</p>
          </div>
        </div>
      }
      errorFallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Map Unavailable
            </h2>
            <p className="text-gray-600">
              The campaigns map could not be loaded. Please try refreshing the
              page.
            </p>
          </div>
        </div>
      }
    >
      <CampaignDiscoveryMap />
    </AsyncBoundary>
  );
}
