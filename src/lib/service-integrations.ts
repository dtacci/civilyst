/**
 * Service Integration Configuration & Health Checks
 *
 * This module provides utilities to check service configuration status
 * and handle graceful degradation when services are not configured.
 */

import { env, isServiceConfigured } from '~/env';

export interface ServiceStatus {
  name: string;
  configured: boolean;
  required: boolean;
  fallback?: string;
  setupInstructions?: string;
}

export interface ServiceIntegrationStatus {
  services: ServiceStatus[];
  allRequired: boolean;
  summary: {
    total: number;
    configured: number;
    required: number;
    requiredConfigured: number;
  };
}

/**
 * Get the status of all service integrations
 */
export function getServiceIntegrationStatus(): ServiceIntegrationStatus {
  const services: ServiceStatus[] = [
    {
      name: 'Redis (Upstash)',
      configured: isServiceConfigured.redis(),
      required: false,
      fallback: 'Direct database queries (no caching)',
      setupInstructions:
        'Create Upstash Redis instance and add UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN to environment',
    },
    {
      name: 'Mapbox',
      configured: isServiceConfigured.mapbox(),
      required: false,
      fallback: 'Leaflet with OpenStreetMap (free maps)',
      setupInstructions:
        'Get Mapbox access token and add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to environment',
    },
    {
      name: 'Uploadthing',
      configured: isServiceConfigured.uploadthing(),
      required: false,
      fallback: 'File uploads disabled',
      setupInstructions:
        'Create Uploadthing app and add UPLOADTHING_SECRET, UPLOADTHING_APP_ID to environment',
    },
    {
      name: 'Supabase',
      configured: isServiceConfigured.supabase(),
      required: false,
      fallback: 'Real-time features disabled',
      setupInstructions:
        'Create Supabase project and add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY to environment',
    },
    {
      name: 'Resend',
      configured: isServiceConfigured.resend(),
      required: false,
      fallback: 'Email notifications disabled',
      setupInstructions:
        'Get Resend API key and add RESEND_API_KEY to environment',
    },
    {
      name: 'OpenAI',
      configured: isServiceConfigured.openai(),
      required: false,
      fallback: 'AI content moderation disabled',
      setupInstructions:
        'Get OpenAI API key and add OPENAI_API_KEY to environment',
    },
    {
      name: 'Sentry',
      configured: isServiceConfigured.sentry(),
      required: false,
      fallback: 'Error tracking uses console logs only',
      setupInstructions:
        'Create Sentry project and add SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN to environment',
    },
    {
      name: 'Inngest',
      configured: isServiceConfigured.inngest(),
      required: false,
      fallback: 'Background jobs run synchronously',
      setupInstructions:
        'Create Inngest account and add INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY to environment',
    },
    {
      name: 'LaunchDarkly',
      configured: isServiceConfigured.launchdarkly(),
      required: false,
      fallback: 'Feature flags disabled (all features enabled)',
      setupInstructions:
        'Create LaunchDarkly project and add LAUNCHDARKLY_SDK_KEY to environment',
    },
  ];

  const total = services.length;
  const configured = services.filter((s) => s.configured).length;
  const required = services.filter((s) => s.required).length;
  const requiredConfigured = services.filter(
    (s) => s.required && s.configured
  ).length;
  const allRequired = required === requiredConfigured;

  return {
    services,
    allRequired,
    summary: {
      total,
      configured,
      required,
      requiredConfigured,
    },
  };
}

/**
 * Log service integration status to console
 */
export function logServiceStatus(): void {
  const status = getServiceIntegrationStatus();

  console.log('\n🔌 Service Integration Status:');
  console.log(
    `   Configured: ${status.summary.configured}/${status.summary.total}`
  );

  if (status.summary.required > 0) {
    console.log(
      `   Required: ${status.summary.requiredConfigured}/${status.summary.required} ✅`
    );
  }

  console.log('\n📋 Service Details:');
  status.services.forEach((service) => {
    const icon = service.configured ? '✅' : '⚠️';
    const reqText = service.required ? ' (REQUIRED)' : '';
    console.log(`   ${icon} ${service.name}${reqText}`);

    if (!service.configured && service.fallback) {
      console.log(`      → Fallback: ${service.fallback}`);
    }
  });

  console.log('\n');
}

/**
 * Get setup instructions for unconfigured services
 */
export function getSetupInstructions(): string[] {
  const status = getServiceIntegrationStatus();
  const unconfigured = status.services.filter((s) => !s.configured);

  return unconfigured.map((service) => {
    const priority = service.required ? '[REQUIRED]' : '[OPTIONAL]';
    return `${priority} ${service.name}: ${service.setupInstructions}`;
  });
}

/**
 * Generate environment variable template for missing services
 */
export function generateEnvTemplate(): string {
  const status = getServiceIntegrationStatus();
  const unconfigured = status.services.filter((s) => !s.configured);

  if (unconfigured.length === 0) {
    return '# All services are configured! 🎉';
  }

  let template = '# Missing Service Configuration\n';
  template += '# Add these to your .env.local file:\n\n';

  unconfigured.forEach((service) => {
    template += `# ${service.name}\n`;

    switch (service.name) {
      case 'Redis (Upstash)':
        template +=
          'UPSTASH_REDIS_REST_URL=https://your_redis_url.upstash.io\n';
        template += 'UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here\n';
        break;
      case 'Mapbox':
        template +=
          'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here\n';
        break;
      case 'Uploadthing':
        template +=
          'UPLOADTHING_SECRET=sk_live_your_uploadthing_secret_key_here\n';
        template += 'UPLOADTHING_APP_ID=your_uploadthing_app_id_here\n';
        break;
      case 'Supabase':
        template +=
          'NEXT_PUBLIC_SUPABASE_URL=https://your_project_id.supabase.co\n';
        template +=
          'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here\n';
        break;
      case 'Resend':
        template += 'RESEND_API_KEY=re_your_resend_api_key_here\n';
        break;
      case 'OpenAI':
        template += 'OPENAI_API_KEY=sk_your_openai_api_key_here\n';
        break;
      case 'Sentry':
        template +=
          'SENTRY_DSN=https://your_sentry_dsn_here.ingest.sentry.io/project_id\n';
        template +=
          'NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn_here.ingest.sentry.io/project_id\n';
        break;
      case 'Inngest':
        template += 'INNGEST_EVENT_KEY=your_inngest_event_key_here\n';
        template +=
          'INNGEST_SIGNING_KEY=signkey_your_inngest_signing_key_here\n';
        break;
      case 'LaunchDarkly':
        template += 'LAUNCHDARKLY_SDK_KEY=sdk_your_launchdarkly_key_here\n';
        break;
    }

    template += '\n';
  });

  return template;
}

/**
 * Check if core functionality is available (app can run)
 */
export function canRunApp(): { canRun: boolean; missingRequired: string[] } {
  const status = getServiceIntegrationStatus();
  const missingRequired = status.services
    .filter((s) => s.required && !s.configured)
    .map((s) => s.name);

  return {
    canRun: missingRequired.length === 0,
    missingRequired,
  };
}

/**
 * Initialize service status logging (call this in app startup)
 */
export function initializeServiceMonitoring(): void {
  if (env.NODE_ENV === 'development') {
    logServiceStatus();

    const instructions = getSetupInstructions();
    if (instructions.length > 0) {
      console.log('🛠️  Setup Instructions:');
      instructions.forEach((instruction) => {
        console.log(`   ${instruction}`);
      });
      console.log('\n');
    }
  }
}
