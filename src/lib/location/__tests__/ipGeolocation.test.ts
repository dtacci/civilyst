import { 
  getLocationFromIP, 
  calculateDistance, 
  areLocationsConsistent 
} from '../ipGeolocation';

// Mock fetch globally
global.fetch = jest.fn();

describe('IP Geolocation Service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('getLocationFromIP', () => {
    const mockIPResponse = {
      ip: '8.8.8.8',
      city: 'Mountain View',
      region: 'California',
      country: 'US',
      loc: '37.4056,-122.0775',
      postal: '94043',
      timezone: 'America/Los_Angeles'
    };

    it('should return location data for valid IP', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIPResponse,
      });

      const result = await getLocationFromIP('8.8.8.8');

      expect(result).toEqual({
        lat: 37.4056,
        lng: -122.0775,
        address: 'Mountain View, California 94043',
        city: 'Mountain View',
        state: 'California',
        zip: '94043',
        country: 'US',
      });

      expect(fetch).toHaveBeenCalledWith('https://ipinfo.io/8.8.8.8/json', {
        headers: {
          Accept: 'application/json',
        },
      });
    });

    it('should handle auto-detect IP when no IP provided', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockIPResponse,
      });

      await getLocationFromIP();

      expect(fetch).toHaveBeenCalledWith('https://ipinfo.io/json/json', {
        headers: {
          Accept: 'application/json',
        },
      });
    });

    it('should skip in development when no IP provided', async () => {
      process.env.NODE_ENV = 'development';
      
      const result = await getLocationFromIP();

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle missing location data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockIPResponse, loc: undefined }),
      });

      const result = await getLocationFromIP('8.8.8.8');

      expect(result).toBeNull();
    });

    it('should handle API failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await getLocationFromIP('invalid.ip');

      expect(result).toBeNull();
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getLocationFromIP('8.8.8.8');

      expect(result).toBeNull();
    });

    it('should handle partial location data', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ip: '8.8.8.8',
          loc: '37.4056,-122.0775',
          // Missing city, region, etc.
        }),
      });

      const result = await getLocationFromIP('8.8.8.8');

      expect(result).toEqual({
        lat: 37.4056,
        lng: -122.0775,
        address: 'Unknown,',
        city: 'Unknown',
        state: '',
        zip: '',
        country: '',
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between San Francisco and Oakland', () => {
      // SF: 37.7749, -122.4194
      // Oakland: 37.8044, -122.2712
      const distance = calculateDistance(37.7749, -122.4194, 37.8044, -122.2712);
      
      // Should be approximately 8-10 miles
      expect(distance).toBeGreaterThan(8);
      expect(distance).toBeLessThan(10);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });

    it('should calculate distance between distant cities', () => {
      // SF to NYC should be ~2500+ miles
      const distance = calculateDistance(37.7749, -122.4194, 40.7128, -74.0060);
      expect(distance).toBeGreaterThan(2500);
      expect(distance).toBeLessThan(3000);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-37.7749, 122.4194, 37.7749, -122.4194);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('areLocationsConsistent', () => {
    it('should return true for nearby locations', () => {
      // SF and Oakland are ~9 miles apart
      const consistent = areLocationsConsistent(
        37.7749, -122.4194, // SF
        37.8044, -122.2712  // Oakland
      );
      expect(consistent).toBe(true);
    });

    it('should return false for distant locations', () => {
      // SF and NYC are ~2500+ miles apart  
      const consistent = areLocationsConsistent(
        37.7749, -122.4194, // SF
        40.7128, -74.0060   // NYC
      );
      expect(consistent).toBe(false);
    });

    it('should use custom threshold', () => {
      // SF and Oakland with 5-mile threshold
      const consistent = areLocationsConsistent(
        37.7749, -122.4194, // SF
        37.8044, -122.2712, // Oakland
        5 // 5-mile threshold
      );
      expect(consistent).toBe(false);
    });

    it('should return true for same location', () => {
      const consistent = areLocationsConsistent(
        37.7749, -122.4194,
        37.7749, -122.4194
      );
      expect(consistent).toBe(true);
    });

    it('should use default 50-mile threshold', () => {
      // SF and San Jose are ~42 miles apart - should be consistent
      const consistent = areLocationsConsistent(
        37.7749, -122.4194, // SF
        37.3382, -121.8863  // San Jose
      );
      expect(consistent).toBe(true);
    });
  });
});