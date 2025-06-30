'use client';

import { useState } from 'react';
import { MapboxMap } from './MapboxMap';
import { LocationSearch } from './LocationSearch';
import { GeocodeResult, reverseGeocode } from '~/lib/geocoding';

export interface LocationPickerProps {
  onLocationChange: (location: GeocodeResult) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  className?: string;
}

export function LocationPicker({
  onLocationChange,
  initialLocation,
  className = '',
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(
    initialLocation
      ? {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          address: initialLocation.address || '',
        }
      : null
  );

  const handleSearchSelect = (location: GeocodeResult) => {
    setSelectedLocation(location);
    onLocationChange(location);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const addressInfo = await reverseGeocode(lat, lng);
      const location: GeocodeResult = {
        latitude: lat,
        longitude: lng,
        address: addressInfo?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: addressInfo?.city,
        state: addressInfo?.state,
        zipCode: addressInfo?.zipCode,
        country: addressInfo?.country,
      };

      setSelectedLocation(location);
      onLocationChange(location);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates
      const location: GeocodeResult = {
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };

      setSelectedLocation(location);
      onLocationChange(location);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search for a location
        </label>
        <LocationSearch
          onLocationSelect={handleSearchSelect}
          placeholder="Enter an address, city, or landmark..."
          defaultValue={selectedLocation?.address}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or click on the map to select a location
        </label>
        <MapboxMap
          latitude={selectedLocation?.latitude}
          longitude={selectedLocation?.longitude}
          zoom={selectedLocation ? 14 : 10}
          onLocationSelect={handleMapClick}
          markers={
            selectedLocation
              ? [
                  {
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    title: 'Selected Location',
                    description: selectedLocation.address,
                  },
                ]
              : []
          }
          className="h-64 w-full"
        />
      </div>

      {selectedLocation && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Selected Location:</h4>
          <p className="text-sm text-gray-600">{selectedLocation.address}</p>
          <p className="text-xs text-gray-500 mt-1">
            Coordinates: {selectedLocation.latitude.toFixed(6)},{' '}
            {selectedLocation.longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}