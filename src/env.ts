import { z } from 'zod';

/**
 * We validate environment variables with Zod.  However, **browser bundles**
 * only have access to variables prefixed with `NEXT_PUBLIC_`.
 *
 * To avoid runtime ZodErrors on the client we split validation into
 * two schemas and decide at runtime which one to use.
 */

// --------------------------------------------------------------------------- //
// Server-only schema – validated when code executes on the server.
// --------------------------------------------------------------------------- //
const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // Authentication - Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'Clerk publishable key is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'Clerk secret key is required'),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Database - Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // Maps - Mapbox
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().optional(),

  // Cache - Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // File Storage - Uploadthing
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  // Email - Resend
  RESEND_API_KEY: z
    .string()
    .regex(/^re_/, 'Invalid Resend API key format')
    .optional(),

  // Background Jobs - Inngest
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z
    .string()
    .regex(/^signkey_/, 'Invalid Inngest signing key format')
    .optional(),

  // Feature Flags - LaunchDarkly
  LAUNCHDARKLY_SDK_KEY: z
    .string()
    .regex(/^sdk_/, 'Invalid LaunchDarkly SDK key format')
    .optional(),

  // AI Services
  OPENAI_API_KEY: z
    .string()
    .regex(/^sk-/, 'Invalid OpenAI API key format')
    .optional(),

  // CAPTCHA - hCaptcha
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: z.string().optional(),
  HCAPTCHA_SECRET_KEY: z.string().optional(),

  // Monitoring & Error Tracking - Sentry
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
  NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),

  // Webhook Security
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .regex(/^whsec_/, 'Invalid Stripe webhook secret format')
    .optional(),

  // Environment Configuration
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('Invalid app URL')
    .default('http://localhost:3000'),
});

// --------------------------------------------------------------------------- //
// Client schema –  only public variables (prefixed with NEXT_PUBLIC_)
// --------------------------------------------------------------------------- //
/**
 * NOTE:  Public variables can be absent in some build / test scenarios.
 * We therefore mark the entire schema as `.partial()` (all fields optional)
 * and add runtime logging for any *truly* required public vars that are
 * missing.  This prevents hard-crashing the browser with a ZodError while
 * still surfacing helpful diagnostics in the console.
 */
const clientSchema = z
  .object({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
      .string()
      .min(1, 'Clerk publishable key is required'),

    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().optional(),
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: z.string().optional(),

    NEXT_PUBLIC_APP_URL: z
      .string()
      .url('Invalid app URL')
      .default('http://localhost:3000'),

    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    // Sentry (public)
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),
    NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),
  })
  .partial(); // <- make all keys optional so missing vars don’t throw

// --------------------------------------------------------------------------- //
// Runtime selection: use server schema on the server, client schema in browser
// --------------------------------------------------------------------------- //
const isServer = typeof window === 'undefined';
// Use a broad but safe type to avoid `any` while accommodating both schemas
let parsedEnv: Record<string, unknown>;

if (isServer) {
  // Fail hard on the server
  parsedEnv = serverSchema.parse(process.env);
} else {
  // Be forgiving on the client – log missing critical vars
  const result = clientSchema.safeParse(process.env);
  if (!result.success) {
    // This should be rare thanks to `.partial()`, but log details just in case
    console.warn(
      '[env.ts] Client-side env validation failed:',
      result.error.flatten().fieldErrors
    );
    parsedEnv = {};
  } else {
    parsedEnv = result.data;
    // Extra runtime check for public Clerk key – warn if absent
    if (!parsedEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      console.warn(
        '[env.ts] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing in client bundle.'
      );
    }
  }
}

export const env = parsedEnv as z.infer<typeof serverSchema> &
  z.infer<typeof clientSchema>;

// Type-safe environment variables
export type Env = typeof env;

// Environment validation for different stages
export const validateRequiredForProduction = () => {
  if (env.NODE_ENV === 'production') {
    const requiredForProd = z.object({
      DATABASE_URL: z.string().min(1),
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
      CLERK_SECRET_KEY: z.string().min(1),
      NEXT_PUBLIC_APP_URL: z.string().url(),
    });

    return requiredForProd.parse(process.env);
  }
  return env;
};

// Utility to check if a service is configured
export const isServiceConfigured = {
  redis: () => !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
  mapbox: () => !!env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  uploadthing: () => !!(env.UPLOADTHING_SECRET && env.UPLOADTHING_APP_ID),
  resend: () => !!env.RESEND_API_KEY,
  inngest: () => !!(env.INNGEST_EVENT_KEY && env.INNGEST_SIGNING_KEY),
  launchdarkly: () => !!env.LAUNCHDARKLY_SDK_KEY,
  openai: () => !!env.OPENAI_API_KEY,
  supabase: () =>
    !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  sentry: () => !!(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN),
  hcaptcha: () =>
    !!(env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && env.HCAPTCHA_SECRET_KEY),
};
