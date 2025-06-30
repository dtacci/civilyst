import { z } from 'zod';

// Environment validation schema following OWASP security practices
const envSchema = z.object({
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

// Parse and validate environment variables at startup
export const env = envSchema.parse(process.env);

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

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
};
