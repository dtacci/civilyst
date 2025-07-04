import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';
import { appRouter } from '../../../api/root';
import { db } from '~/lib/db';
import { WonderCategory, WonderTimeContext, TrustSignalType } from '~/generated/prisma';

// Mock the location services
jest.mock('~/lib/location/ipGeolocation', () => ({
  getLocationFromIP: jest.fn(),
  areLocationsConsistent: jest.fn(),
}));

jest.mock('~/lib/location/communityBoundaries', () => ({
  calculateLocationTrustBonus: jest.fn(),
}));

jest.mock('~/lib/geocoding', () => ({
  reverseGeocode: jest.fn(),
}));

const { getLocationFromIP, areLocationsConsistent } = require('~/lib/location/ipGeolocation');
const { calculateLocationTrustBonus } = require('~/lib/location/communityBoundaries');
const { reverseGeocode } = require('~/lib/geocoding');

describe('Wonders Router - Location Verification', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Setup default mocks
    getLocationFromIP.mockResolvedValue({
      lat: 37.7749,
      lng: -122.4194,
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      zip: '94102',
      address: 'San Francisco, CA 94102',
    });

    areLocationsConsistent.mockReturnValue(true);

    calculateLocationTrustBonus.mockReturnValue({
      bonus: 0.3,
      reason: 'Within San Francisco Bay Area community',
    });

    reverseGeocode.mockResolvedValue({
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      formattedAddress: 'San Francisco, CA, USA',
    });
  });

  describe('createAnonymous mutation', () => {
    const mockInput = {
      deviceId: 'test-device-id-12345678901234567890123456789012',
      content: 'What if we had better bike lanes downtown?',
      location: {
        type: 'Point' as const,
        coordinates: [-122.4194, 37.7749] as [number, number],
      },
      category: WonderCategory.INFRASTRUCTURE,
      timeContext: WonderTimeContext.ANYTIME,
    };

    it('should create anonymous wonder with location verification', async () => {
      const caller = appRouter.createCaller({
        userId: null,
        req: {
          headers: {
            'x-forwarded-for': '192.168.1.1',
          },
        } as any,
      });

      const result = await caller.wonders.createAnonymous(mockInput);

      expect(result).toBeDefined();
      expect(result.deviceId).toBe(mockInput.deviceId);
      expect(result.content).toBe(mockInput.content);
      expect(result.location).toEqual(mockInput.location);
      expect(result.metadata).toBeDefined();

      // Verify location services were called
      expect(getLocationFromIP).toHaveBeenCalledWith('192.168.1.1');
      expect(reverseGeocode).toHaveBeenCalledWith(37.7749, -122.4194);
      expect(areLocationsConsistent).toHaveBeenCalledWith(
        37.7749, -122.4194, // GPS coordinates
        37.7749, -122.4194  // IP coordinates (mocked same)
      );
      expect(calculateLocationTrustBonus).toHaveBeenCalledWith(37.7749, -122.4194);
    });

    it('should store comprehensive location metadata', async () => {
      const caller = appRouter.createCaller({
        userId: null,
        req: {
          headers: {
            'x-forwarded-for': '192.168.1.1',
          },
        } as any,
      });

      const result = await caller.wonders.createAnonymous(mockInput);

      const metadata = result.metadata as any;
      expect(metadata).toMatchObject({
        locationCity: 'San Francisco',
        locationAddress: 'San Francisco, CA, USA',
        ipLocation: {
          city: 'San Francisco',
          lat: 37.7749,
          lng: -122.4194,
        },
        locationConsistent: true,
        trustBonusReason: 'Within San Francisco Bay Area community',
        communityBoundary: true,
      });
    });

    it('should create trust signals for location verification', async () => {
      const caller = appRouter.createCaller({
        userId: null,
        req: {
          headers: {
            'x-forwarded-for': '192.168.1.1',
          },
        } as any,
      });

      await caller.wonders.createAnonymous(mockInput);

      // Check that trust signals were created
      const trustSignals = await db.trustSignal.findMany({
        where: {
          deviceId: mockInput.deviceId,
        },
      });

      expect(trustSignals).toHaveLength(2);

      // Content quality signal
      const contentSignal = trustSignals.find(
        s => s.signalType === TrustSignalType.CONTENT_QUALITY
      );
      expect(contentSignal).toBeDefined();
      expect(contentSignal!.signalValue).toBe(0.1);

      // Location verification signal with bonus
      const locationSignal = trustSignals.find(
        s => s.signalType === TrustSignalType.LOCATION_VERIFIED
      );
      expect(locationSignal).toBeDefined();
      expect(locationSignal!.signalValue).toBe(0.5); // 0.2 base + 0.3 bonus
      expect(locationSignal!.metadata).toMatchObject({
        coordinates: [-122.4194, 37.7749],
        locationCity: 'San Francisco',
        locationConsistent: true,
        trustBonusReason: 'Within San Francisco Bay Area community',
      });
    });

    it('should handle anonymous wonder without location', async () => {
      const inputWithoutLocation = {
        ...mockInput,
        location: undefined,
      };

      const caller = appRouter.createCaller({
        userId: null,
        req: { headers: {} } as any,
      });

      const result = await caller.wonders.createAnonymous(inputWithoutLocation);

      expect(result.location).toBeUndefined();
      expect(result.metadata).toBeUndefined();

      // Should only have content quality signal
      const trustSignals = await db.trustSignal.findMany({
        where: {
          deviceId: mockInput.deviceId,
        },
      });

      expect(trustSignals).toHaveLength(1);
      expect(trustSignals[0]!.signalType).toBe(TrustSignalType.CONTENT_QUALITY);
    });

    it('should handle IP geolocation failure gracefully', async () => {
      getLocationFromIP.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        userId: null,
        req: {
          headers: {
            'x-forwarded-for': '192.168.1.1',
          },
        } as any,
      });

      const result = await caller.wonders.createAnonymous(mockInput);

      expect(result).toBeDefined();
      const metadata = result.metadata as any;
      expect(metadata.ipLocation).toBeNull();
      expect(metadata.locationConsistent).toBe(false);
    });

    it('should handle reverse geocoding failure gracefully', async () => {
      reverseGeocode.mockResolvedValue(null);

      const caller = appRouter.createCaller({
        userId: null,
        req: {
          headers: {
            'x-forwarded-for': '192.168.1.1',
          },
        } as any,
      });

      const result = await caller.wonders.createAnonymous(mockInput);

      expect(result).toBeDefined();
      const metadata = result.metadata as any;
      expect(metadata.locationCity).toBe('Unknown');
    });

    it('should handle inconsistent locations', async () => {
      areLocationsConsistent.mockReturnValue(false);
      calculateLocationTrustBonus.mockReturnValue({
        bonus: 0.1,
        reason: 'Location verified',
      });

      const caller = appRouter.createCaller({
        userId: null,
        req: {
          headers: {
            'x-forwarded-for': '192.168.1.1',
          },
        } as any,
      });

      const result = await caller.wonders.createAnonymous(mockInput);

      const metadata = result.metadata as any;
      expect(metadata.locationConsistent).toBe(false);
      expect(metadata.trustBonusReason).toBe('Location verified');
      expect(metadata.communityBoundary).toBe(false);

      // Trust signal should have lower value
      const locationSignal = await db.trustSignal.findFirst({
        where: {
          deviceId: mockInput.deviceId,
          signalType: TrustSignalType.LOCATION_VERIFIED,
        },
      });

      expect(locationSignal!.signalValue).toBe(0.3); // 0.2 base + 0.1 bonus
    });

    it('should handle missing IP header', async () => {
      const caller = appRouter.createCaller({
        userId: null,
        req: { headers: {} } as any,
      });

      const result = await caller.wonders.createAnonymous(mockInput);

      expect(result).toBeDefined();
      expect(getLocationFromIP).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getAnonymousWonders query', () => {
    it('should return wonders with calculated trust score', async () => {
      const deviceId = 'test-device-id-12345678901234567890123456789012';

      // Create some test data
      await db.anonymousWonder.create({
        data: {
          deviceId,
          content: 'Test wonder',
          category: WonderCategory.GENERAL,
          timeContext: WonderTimeContext.ANYTIME,
          metadata: {
            locationCity: 'San Francisco',
          },
        },
      });

      await db.trustSignal.createMany({
        data: [
          {
            deviceId,
            signalType: TrustSignalType.CONTENT_QUALITY,
            signalValue: 0.1,
          },
          {
            deviceId,
            signalType: TrustSignalType.LOCATION_VERIFIED,
            signalValue: 0.3,
          },
        ],
      });

      const caller = appRouter.createCaller({
        userId: null,
        req: { headers: {} } as any,
      });

      const result = await caller.wonders.getAnonymousWonders({ deviceId });

      expect(result.wonders).toHaveLength(1);
      expect(result.trustScore).toBe(0.4); // 0.1 + 0.3
      expect(result.wonders[0]!.metadata).toMatchObject({
        locationCity: 'San Francisco',
      });
    });

    it('should cap trust score at 1.0', async () => {
      const deviceId = 'test-device-id-12345678901234567890123456789013';

      // Create trust signals that sum to more than 1.0
      await db.trustSignal.createMany({
        data: [
          {
            deviceId,
            signalType: TrustSignalType.CONTENT_QUALITY,
            signalValue: 0.8,
          },
          {
            deviceId,
            signalType: TrustSignalType.LOCATION_VERIFIED,
            signalValue: 0.5,
          },
        ],
      });

      const caller = appRouter.createCaller({
        userId: null,
        req: { headers: {} } as any,
      });

      const result = await caller.wonders.getAnonymousWonders({ deviceId });

      expect(result.trustScore).toBe(1.0); // Capped at 1.0
    });
  });
});