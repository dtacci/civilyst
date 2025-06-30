import { z } from 'zod';
import { createTRPCRouter, rateLimitedProcedure } from '~/server/api/trpc';
import { geocodeAddress, reverseGeocode } from '~/lib/geocoding';

export const geocodingRouter = createTRPCRouter({
  geocode: rateLimitedProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Search query is required'),
      })
    )
    .query(async ({ input }) => {
      const result = await geocodeAddress(input.query);
      
      if (!result) {
        throw new Error('Location not found');
      }

      return result;
    }),

  reverseGeocode: rateLimitedProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
    )
    .query(async ({ input }) => {
      const result = await reverseGeocode(input.latitude, input.longitude);
      
      if (!result) {
        throw new Error('Unable to reverse geocode coordinates');
      }

      return result;
    }),

  nearbySearch: rateLimitedProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radius: z.number().min(0.1).max(50).default(5), // radius in kilometers
        query: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // This will be implemented when we have PostGIS integration
      // For now, return empty results
      return {
        results: [],
        center: {
          latitude: input.latitude,
          longitude: input.longitude,
        },
        radius: input.radius,
      };
    }),
});