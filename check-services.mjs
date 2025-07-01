#!/usr/bin/env node

// Simple script to check which services are configured
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve('.env.local') });

console.log('🔍 Checking Service Configuration...\n');

const services = {
  'Clerk Authentication': {
    vars: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
    required: true
  },
  'Database (Supabase)': {
    vars: ['DATABASE_URL'],
    required: true
  },
  'Mapbox Maps': {
    vars: ['NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN'],
    required: false,
    fallback: 'OpenStreetMap via Leaflet'
  },
  'Supabase Realtime': {
    vars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    required: false,
    fallback: 'Real-time updates disabled'
  },
  'Redis Caching': {
    vars: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    required: false,
    fallback: 'Direct database queries (no caching)'
  },
  'File Uploads': {
    vars: ['UPLOADTHING_SECRET', 'UPLOADTHING_APP_ID'],
    required: false,
    fallback: 'File uploads disabled'
  }
};

let configuredCount = 0;
let totalCount = 0;

console.log('📋 Service Status:\n');

Object.entries(services).forEach(([name, config]) => {
  totalCount++;
  
  const isConfigured = config.vars.every(varName => {
    const value = process.env[varName];
    return value && 
           value.trim() !== '' && 
           !value.startsWith('your_') && 
           !value.includes('_here');
  });
  
  if (isConfigured) {
    configuredCount++;
  }
  
  const icon = isConfigured ? '✅' : '⚠️';
  const reqText = config.required ? ' (REQUIRED)' : '';
  
  console.log(`${icon} ${name}${reqText}`);
  
  if (!isConfigured) {
    if (config.fallback) {
      console.log(`   → Fallback: ${config.fallback}`);
    }
    console.log(`   → Variables: ${config.vars.join(', ')}`);
  }
  
  console.log('');
});

console.log('📊 Summary:');
console.log(`   Configured: ${configuredCount}/${totalCount} services`);
console.log(`   Coverage: ${Math.round((configuredCount / totalCount) * 100)}%`);

if (configuredCount === totalCount) {
  console.log('\n🎉 All services are configured! Your app has full functionality.');
} else {
  console.log(`\n🔧 ${totalCount - configuredCount} service(s) need configuration for full functionality.`);
}