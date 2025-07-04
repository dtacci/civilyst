// IP-based location interface (compatible with ipinfo.io)
interface IPLocationResult {
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
  zip: string;
  address: string;
}

interface IPGeolocationResponse {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string; // "latitude,longitude"
  postal?: string;
  timezone?: string;
}

/**
 * Get approximate location from IP address using ipinfo.io
 * Free tier allows 50K requests/month
 */
export async function getLocationFromIP(
  ip?: string
): Promise<IPLocationResult | null> {
  try {
    // In development, use a placeholder IP or skip
    if (process.env.NODE_ENV === 'development' && !ip) {
      console.warn('Skipping IP geolocation in development');
      return null;
    }

    const ipToUse = ip || 'json'; // 'json' endpoint auto-detects caller's IP
    const response = await fetch(`https://ipinfo.io/${ipToUse}/json`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('IP geolocation failed:', response.statusText);
      return null;
    }

    const data = (await response.json()) as IPGeolocationResponse;

    if (!data.loc) {
      return null;
    }

    const [lat, lng] = data.loc.split(',').map(Number);

    return {
      lat,
      lng,
      address:
        `${data.city || 'Unknown'}, ${data.region || ''} ${data.postal || ''}`.trim(),
      city: data.city || 'Unknown',
      state: data.region || '',
      zip: data.postal || '',
      country: data.country || '',
    };
  } catch (error) {
    console.error('IP geolocation error:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if two locations are within a reasonable distance (for verification)
 * Default threshold is 50 miles
 */
export function areLocationsConsistent(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  thresholdMiles = 50
): boolean {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= thresholdMiles;
}
