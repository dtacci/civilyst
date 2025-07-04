/**
 * Geocoding utilities for reverse geocoding coordinates
 * This is a placeholder for now - will be implemented with actual geocoding service
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface GeocodingResult {
  city: string | null;
  state: string | null;
  country: string | null;
  formattedAddress: string | null;
}

/**
 * Reverse geocode coordinates to get location information
 * TODO: Implement with actual geocoding service (Mapbox, Google, etc.)
 */
export async function reverseGeocode(
  _lat: number,
  _lng: number
): Promise<GeocodingResult | null> {
  // Placeholder implementation
  // In production, this would call a geocoding API
  return {
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
    formattedAddress: 'San Francisco, CA, USA',
  };
}
