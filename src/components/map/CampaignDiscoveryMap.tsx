'use client';

import { useState, useEffect } from 'react';
import { MapboxMap } from './MapboxMap';
import { api } from '~/lib/trpc';
import { CampaignCard } from '~/components/campaigns/CampaignCard';
import { CampaignStatus } from '~/generated/prisma';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { VoiceInput } from '~/components/ui/voice-input';
import {
  Map,
  List,
  Search,
  MapPin,
  Filter,
  Mic,
  Crosshair,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '~/lib/utils';

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
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'ALL'>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<number>(10);
  const [showFilters, setShowFilters] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Fetch user's current location with mobile optimization
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setMapCenter({ latitude, longitude });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting user location:', error);
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 } // 5 min cache
      );
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Fetch campaigns based on search parameters
  const { data: searchData, isLoading: isLoadingSearch } =
    api.campaigns.search.useQuery(
      {
        query: searchQuery || undefined,
        city: selectedCity || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        limit: 50,
      },
      {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      }
    );

  // Fetch nearby campaigns
  const { data: nearbyData, isLoading: isLoadingNearby } =
    api.campaigns.findNearby.useQuery(
      {
        latitude: userLocation?.latitude ?? 0,
        longitude: userLocation?.longitude ?? 0,
        limit: 50,
      },
      {
        enabled: !!userLocation,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      }
    );

  // Combine search and nearby results
  const campaignsToDisplay =
    userLocation && nearbyData?.campaigns.length
      ? nearbyData.campaigns
      : searchData?.campaigns || [];

  const isLoading = isLoadingSearch || isLoadingNearby;

  // Mobile-first handlers
  const handleMapClick = (lat: number, lng: number) => {
    setMapCenter({ latitude: lat, longitude: lng });
  };

  const handleVoiceSearch = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setSearchQuery(transcript);
      setShowVoiceSearch(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedStatus('ALL');
  };

  // Prepare markers for the map
  const mapMarkers = campaignsToDisplay.map((campaign) => ({
    latitude: campaign.latitude || 0,
    longitude: campaign.longitude || 0,
    title: campaign.title,
    description: campaign.description,
  }));

  return (
    <div className="min-h-screen bg-[--color-background]">
      {/* Mobile-First Header */}
      <div className="bg-[--color-surface-elevated] border-b border-[--color-border] sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[--font-size-2xl] font-bold text-[--color-text-primary] leading-[--line-height-tight]">
                Discover Campaigns
              </h1>
              <p className="text-[--color-text-secondary] text-[--font-size-sm]">
                {campaignsToDisplay.length} campaigns {userLocation ? 'near you' : 'available'}
              </p>
            </div>
            
            {/* Location Button */}
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              size="icon"
              variant="outline"
              className="flex-shrink-0"
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Mobile Search Bar */}
          <div className="relative">
            <div className="flex gap-2">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[--color-text-tertiary]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns..."
                  className={cn(
                    "w-full pl-10 pr-10 py-3 rounded-[--border-radius-lg]",
                    "border border-[--color-border] bg-[--color-surface]",
                    "text-[--color-text-primary] placeholder:text-[--color-text-tertiary]",
                    "focus:ring-2 focus:ring-[--color-border-focus] focus:border-transparent",
                    "transition-all duration-[--duration-normal]"
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[--color-surface-hover] rounded-[--border-radius-sm] transition-colors"
                  >
                    <X className="h-3 w-3 text-[--color-text-tertiary]" />
                  </button>
                )}
              </div>
              
              {/* Voice Search Button */}
              <Button
                onClick={() => setShowVoiceSearch(!showVoiceSearch)}
                variant={showVoiceSearch ? "default" : "outline"}
                size="icon"
                className="flex-shrink-0"
              >
                <Mic className="h-4 w-4" />
              </Button>
              
              {/* Filters Button */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "default" : "outline"}
                size="icon"
                className="flex-shrink-0"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Voice Search Panel */}
            {showVoiceSearch && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50">
                <CardContent className="p-4">
                  <VoiceInput
                    onTranscript={handleVoiceSearch}
                    placeholder="Say what you're looking for..."
                    autoStart={true}
                    className="border-0 p-0 bg-transparent"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-First Filter Panel */}
      {showFilters && (
        <div className="bg-[--color-surface-elevated] border-b border-[--color-border] sticky top-[140px] z-30">
          <div className="container mx-auto px-4 py-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* City Filter */}
                <div>
                  <label className="block text-[--font-size-sm] font-medium text-[--color-text-primary] mb-2">
                    City
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className={cn(
                        "w-full appearance-none px-3 py-2 pr-8 rounded-[--border-radius-md]",
                        "border border-[--color-border] bg-[--color-surface]",
                        "text-[--color-text-primary] focus:ring-2 focus:ring-[--color-border-focus]"
                      )}>
                      <option value="">All Cities</option>
                      <option value="San Francisco">San Francisco</option>
                      <option value="Los Angeles">Los Angeles</option>
                      <option value="San Diego">San Diego</option>
                      <option value="Sacramento">Sacramento</option>
                      <option value="Oakland">Oakland</option>
                      <option value="Berkeley">Berkeley</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[--color-text-tertiary] pointer-events-none" />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[--font-size-sm] font-medium text-[--color-text-primary] mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['ALL', 'ACTIVE', 'DRAFT', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
                      <Button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        variant={selectedStatus === status ? "default" : "outline"}
                        size="sm"
                        className="text-[--font-size-xs]"
                      >
                        {status === 'ALL' ? 'All' : status.toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Radius Slider (only if user location available) */}
                {userLocation && (
                  <div>
                    <label className="block text-[--font-size-sm] font-medium text-[--color-text-primary] mb-2">
                      Search Radius: {selectedRadius} km
                    </label>
                    <div className="px-2">
                      <input
                        type="range"
                        min={1}
                        max={50}
                        step={1}
                        value={selectedRadius}
                        onChange={(e) => setSelectedRadius(Number(e.target.value))}
                        className="w-full h-2 bg-[--color-surface] rounded-[--border-radius-full] appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Mobile View Toggle */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('map')}
            variant={viewMode === 'map' ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            <Map className="h-4 w-4 mr-2" />
            Map View
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? "default" : "outline"}
            size="sm"
            className="flex-1"
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pb-8">
        {isLoading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[--color-primary] mb-4" />
              <p className="text-[--color-text-secondary]">Discovering campaigns...</p>
            </div>
          </Card>
        ) : campaignsToDisplay.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-[--color-text-tertiary] mx-auto mb-4" />
              <h3 className="text-[--font-size-lg] font-semibold text-[--color-text-primary] mb-2">
                No campaigns found
              </h3>
              <p className="text-[--color-text-secondary] mb-4">
                Try adjusting your search filters or be the first to create a campaign in this area!
              </p>
              <Button onClick={handleClearSearch} variant="outline">
                Clear Filters
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {viewMode === 'map' && (
              <Card className="overflow-hidden">
                <div className="h-[60vh] min-h-[400px] w-full relative">
                  <MapboxMap
                    latitude={mapCenter.latitude}
                    longitude={mapCenter.longitude}
                    zoom={initialZoom}
                    className="w-full h-full"
                    onLocationSelect={handleMapClick}
                    markers={mapMarkers}
                  />
                  
                  {/* Mobile Map Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                    <div className="bg-[--color-surface-elevated] backdrop-blur-md rounded-[--border-radius-lg] p-3 pointer-events-auto">
                      <p className="text-[--font-size-xs] text-[--color-text-secondary] mb-1">
                        {campaignsToDisplay.length} campaigns
                      </p>
                      <p className="text-[--font-size-sm] font-medium text-[--color-text-primary]">
                        {userLocation ? `Within ${selectedRadius}km` : 'All locations'}
                      </p>
                    </div>
                    
                    {userLocation && (
                      <Button
                        onClick={() => setMapCenter({ latitude: userLocation.latitude, longitude: userLocation.longitude })}
                        size="icon"
                        className="pointer-events-auto shadow-[--shadow-elevated]"
                      >
                        <Crosshair className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {viewMode === 'list' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaignsToDisplay.map((campaign) => (
                  <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    compact={true}
                    showLocation={!userLocation} // Hide location if we already know user's location
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
