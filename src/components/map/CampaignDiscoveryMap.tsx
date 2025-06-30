'use client';

import { useState, useEffect } from 'react';
import { MapboxMap } from './MapboxMap';
import { api } from '~/lib/trpc';
import { CampaignCard } from '~/components/campaigns/CampaignCard'; // Assuming this component exists
import { CampaignStatus } from '~/generated/prisma';

export interface CampaignDiscoveryMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  initialZoom?: number;
}

export function CampaignDiscoveryMap({
  initialLatitude = 37.7749, // Default to San Francisco
  initialLongitude = -122.4194,
  initialZoom = 10,
}: CampaignDiscoveryMapProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'ALL'>(
    'ALL'
  );
  const [selectedRadius, setSelectedRadius] = useState<number>(10); // Default 10km

  // Fetch user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setMapCenter({ latitude, longitude }); // Center map on user's location
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Fallback to initial map center if location not available
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Fetch campaigns based on search parameters
  const { data: searchData, isLoading: isLoadingSearch } =
    api.campaigns.search.useQuery(
      {
        query: searchQuery || undefined,
        city: selectedCity || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        limit: 50, // Fetch enough for map and list
      },
      {
        // Only refetch when filters change, not on every render
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      }
    );

  // Fetch nearby campaigns if user location is available and radius is set
  const { data: nearbyData, isLoading: isLoadingNearby } =
    api.campaigns.findNearby.useQuery(
      {
        latitude: userLocation?.latitude ?? 0,
        longitude: userLocation?.longitude ?? 0,
        limit: 50,
      },
      {
        enabled: !!userLocation, // Only run if userLocation is available
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      }
    );

  // Combine search and nearby results, prioritize nearby if available
  const campaignsToDisplay =
    userLocation && nearbyData?.campaigns.length
      ? nearbyData.campaigns
      : searchData?.campaigns || [];

  const isLoading = isLoadingSearch || isLoadingNearby;

  // Map click handler for setting new map center
  const handleMapClick = (lat: number, lng: number) => {
    setMapCenter({ latitude: lat, longitude: lng });
    // Optionally, trigger a search around this new point
    // refetchSearch();
  };

  // Prepare markers for the map
  const mapMarkers = campaignsToDisplay.map((campaign) => ({
    latitude: campaign.latitude || 0,
    longitude: campaign.longitude || 0,
    title: campaign.title,
    description: campaign.description,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Discover Campaigns
          </h1>
          <p className="mt-2 text-gray-600">
            Explore civic engagement projects near you or across the state.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label
                htmlFor="search-query"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search by Keyword
              </label>
              <input
                type="text"
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* City Filter */}
            <div>
              <label
                htmlFor="city-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter by City
              </label>
              <select
                id="city-filter"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                <option value="San Francisco">San Francisco</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="San Diego">San Diego</option>
                <option value="Sacramento">Sacramento</option>
                <option value="Oakland">Oakland</option>
                <option value="Berkeley">Berkeley</option>
                <option value="Palo Alto">Palo Alto</option>
                <option value="Santa Monica">Santa Monica</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as CampaignStatus | 'ALL')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Radius Filter (only if user location is available) */}
            {userLocation && (
              <div>
                <label
                  htmlFor="radius-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Radius: {selectedRadius} km
                </label>
                <input
                  type="range"
                  id="radius-filter"
                  min={1}
                  max={50}
                  step={1}
                  value={selectedRadius}
                  onChange={(e) => setSelectedRadius(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-600">Loading campaigns...</p>
          </div>
        ) : campaignsToDisplay.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search filters or be the first to create a
              campaign!
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'map' && (
              <div className="h-[600px] w-full rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <MapboxMap
                  latitude={mapCenter.latitude}
                  longitude={mapCenter.longitude}
                  zoom={initialZoom}
                  className="w-full h-full"
                  onLocationSelect={handleMapClick} // Allow re-centering map by clicking
                  markers={mapMarkers}
                />
              </div>
            )}

            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaignsToDisplay.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
