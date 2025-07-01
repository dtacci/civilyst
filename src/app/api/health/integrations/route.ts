import { NextResponse } from 'next/server';
import {
  getServiceIntegrationStatus,
  canRunApp,
} from '~/lib/service-integrations';
import { getRedisClient } from '~/lib/redis';

export async function GET() {
  try {
    const serviceStatus = getServiceIntegrationStatus();
    const appStatus = canRunApp();

    // Test Redis connection if configured
    let redisHealth = null;
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.ping();
        redisHealth = { status: 'connected', error: null };
      } catch (error) {
        redisHealth = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const healthData = {
      status: appStatus.canRun ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      app: {
        canRun: appStatus.canRun,
        missingRequired: appStatus.missingRequired,
      },
      services: {
        summary: serviceStatus.summary,
        details: serviceStatus.services.map((service) => ({
          name: service.name,
          configured: service.configured,
          required: service.required,
          fallback: service.fallback,
        })),
      },
      connections: {
        redis: redisHealth,
      },
    };

    return NextResponse.json(healthData, {
      status: appStatus.canRun ? 200 : 206, // 206 = Partial Content (degraded)
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
