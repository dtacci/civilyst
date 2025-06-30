/**
 * Supabase Row Level Security integration with Clerk authentication
 * This module handles setting up RLS context for authenticated users
 */

import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Create Supabase client for RLS operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // For admin operations
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role client for admin operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anonymous client for public operations (respects RLS)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get a Supabase client with the current user's JWT token for RLS
 * This ensures RLS policies can access the user's Clerk ID
 */
export async function getSupabaseWithAuth() {
  const authResult = await auth();
  const token = await authResult?.getToken({ template: 'supabase' });

  if (!token) {
    // Return anonymous client if no auth
    return supabaseClient;
  }

  // Create client with user's JWT for RLS context
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Helper to execute raw SQL with proper RLS context
 * Use this for PostGIS queries that need authentication
 */
export async function executeWithRLS(sql: string, params: unknown[] = []) {
  const supabase = await getSupabaseWithAuth();
  return supabase.rpc('execute_sql', { sql, params });
}

/**
 * Set RLS context for a database session
 * This is used when we need to manually set the JWT claims for RLS
 */
export async function setRLSContext(clerkUserId: string) {
  const claims = {
    sub: clerkUserId,
    aud: 'authenticated',
    role: 'authenticated',
  };

  const supabase = await getSupabaseWithAuth();
  return supabase.rpc('set_config', {
    setting_name: 'request.jwt.claims',
    setting_value: JSON.stringify(claims),
    is_local: true,
  });
}

/**
 * Test RLS policies are working correctly
 * This function can be used to verify security is properly configured
 */
export async function testRLSPolicies() {
  const authResult = await auth();
  const userId = authResult?.userId;

  if (!userId) {
    throw new Error('Must be authenticated to test RLS');
  }

  const supabase = await getSupabaseWithAuth();

  // Test 1: Try to read all users (should only see own profile)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  // Test 2: Try to read active campaigns (should work)
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'ACTIVE');

  // Test 3: Try to read all campaigns (should see own + active ones)
  const { data: allCampaigns, error: allCampaignsError } = await supabase
    .from('campaigns')
    .select('*');

  return {
    users: { data: users, error: usersError },
    activeCampaigns: { data: campaigns, error: campaignsError },
    allCampaigns: { data: allCampaigns, error: allCampaignsError },
  };
}
