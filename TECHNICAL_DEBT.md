# Technical Debt & Known Issues

**Generated:** December 30, 2024  
**Context:** Issues created during rapid deployment to get MVP live

---

## 🚨 **CRITICAL ISSUES (Fix Immediately)**

### **1. Build Configuration Bypasses**
**File:** `next.config.ts`
**Severity:** 🔴 Critical

```typescript
// CURRENT - REMOVE THESE ASAP
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 🚨 HIDING LINT ERRORS
  },
  typescript: {
    ignoreBuildErrors: true,   // 🚨 HIDING TYPE ERRORS
  },
};
```

**Impact:**
- TypeScript errors are hidden and could cause runtime issues
- Code quality issues are not caught during build
- CI/CD pipeline is not validating code quality

**Fix:**
1. Run `npm run type-check` to see all TypeScript errors
2. Run `npm run lint` to see all ESLint errors
3. Fix errors one by one
4. Remove the bypass configuration
5. Ensure build passes with validation enabled

**Estimated Effort:** 4-8 hours

### **2. Broken tRPC Type Safety**
**Files:** `src/lib/trpc.ts`, `src/server/api/trpc.ts`
**Severity:** 🔴 Critical

**Issue:** Removed superjson transformer causing Date serialization issues

**Current Workarounds:**
```typescript
// TEMPORARY WORKAROUND - REMOVE WHEN FIXED
createdAt: Date | string;  // Should be just Date
updatedAt: Date | string;  // Should be just Date

// Manual parsing everywhere
formatDistanceToNow(
  typeof campaign.createdAt === 'string' 
    ? new Date(campaign.createdAt) 
    : campaign.createdAt
)
```

**Impact:**
- Loss of type safety for Date objects
- Manual parsing required throughout app
- Potential runtime errors with date operations
- Poor developer experience

**Fix:**
1. Add superjson back to server tRPC config
2. Add superjson back to client tRPC config
3. Remove manual date parsing from components
4. Update interface types back to proper Date types
5. Test thoroughly

**Estimated Effort:** 2-4 hours

---

## 🟡 **HIGH PRIORITY ISSUES**

### **3. Path Import Inconsistency**
**Files:** Multiple throughout codebase
**Severity:** 🟡 High

**Issue:** Mixing `@/*` and `~/*` import patterns

```typescript
// INCONSISTENT USAGE
import { api } from '~/lib/trpc';        // ~ pattern
import { Button } from '@/components';   // @ pattern
```

**Impact:**
- Confusion for developers
- Potential import resolution issues
- Inconsistent codebase

**Fix:**
1. Choose one pattern (recommend `@/*`)
2. Update all imports to use consistent pattern
3. Remove unused path from tsconfig.json
4. Add ESLint rule to enforce consistency

**Estimated Effort:** 2-3 hours

### **4. Environment Variable Validation Weakened**
**File:** `src/env.ts`
**Severity:** 🟡 High

**Issue:** Removed URL validation for Redis to fix build

```typescript
// BEFORE (strict)
UPSTASH_REDIS_REST_URL: z.string().url('Invalid Redis URL').optional(),

// AFTER (weak)
UPSTASH_REDIS_REST_URL: z.string().optional(),
```

**Impact:**
- Invalid URLs won't be caught at startup
- Harder to debug configuration issues
- Less robust error handling

**Fix:**
1. Create proper schema that handles empty strings
2. Add validation that treats empty string as undefined
3. Test with various environment configurations
4. Restore strict URL validation

**Estimated Effort:** 1-2 hours

---

## 🟠 **MEDIUM PRIORITY ISSUES**

### **5. Type Casting in Campaign Router**
**File:** `src/server/api/routers/campaigns.ts`
**Severity:** 🟠 Medium

**Issue:** Added type casting to work around Prisma enum issues

```typescript
// WORKAROUND
status: campaign.status as PrismaCampaignStatus,
```

**Impact:**
- Bypasses TypeScript safety
- Potential runtime type mismatches
- Not addressing root cause

**Fix:**
1. Investigate proper Prisma enum handling
2. Use proper Prisma client types
3. Remove type casting
4. Ensure enum values match exactly

**Estimated Effort:** 1-2 hours

### **6. Auth Import Updates**
**Files:** `src/lib/db.ts`, `src/lib/supabase-rls.ts`
**Severity:** 🟠 Medium

**Issue:** Updated Clerk auth imports but may not be handling async properly

```typescript
// UPDATED TO
import { auth } from '@clerk/nextjs/server';

// BUT USAGE MAY NEED REVIEW
const authResult = await auth();
const userId = authResult?.userId;
```

**Impact:**
- Potential authentication issues
- May not handle edge cases properly
- Breaking changes in Clerk API not fully addressed

**Fix:**
1. Review Clerk documentation for proper async usage
2. Test authentication flows thoroughly
3. Handle error cases properly
4. Add proper TypeScript types

**Estimated Effort:** 2-3 hours

---

## 🔵 **LOW PRIORITY ISSUES**

### **7. Rate Limiting Type Issues**
**File:** `src/lib/rate-limiting.ts`
**Severity:** 🔵 Low

**Issue:** Added type assertion for Redis response

```typescript
// TYPE ASSERTION WORKAROUND
const oldestRequests = await redis.zrange(key, 0, 0, { withScores: true }) as Array<{ value: string; score: number }>;
```

**Impact:**
- Type assertion bypasses safety
- May not match actual Redis response format
- Could cause runtime errors

**Fix:**
1. Check Redis client documentation for proper types
2. Create proper interface for Redis responses
3. Remove type assertion
4. Add runtime validation if needed

**Estimated Effort:** 1 hour

---

## 🌟 **FEATURE DEBT (Missing Functionality)**

### **8. Missing Service Integrations**
**Severity:** 🟡 High

**Services Currently Disabled:**
- ❌ Upstash Redis (caching)
- ❌ Uploadthing (file uploads)
- ❌ Mapbox (maps)
- ❌ Resend (email)
- ❌ Inngest (background jobs)
- ❌ LaunchDarkly (feature flags)

**Impact:**
- Significantly reduced functionality
- Poor performance without caching
- No file uploads
- No interactive maps
- No email notifications

**Fix Required:** Configure all environment variables and test integrations

### **9. Missing Error Boundaries**
**Severity:** 🟠 Medium

**Issue:** No error boundaries implemented for graceful error handling

**Impact:**
- Poor user experience on errors
- No error recovery
- Potential white screens

**Fix:** Implement error boundaries for major components

### **10. Missing Loading States**
**Severity:** 🟠 Medium

**Issue:** Limited loading states and suspense boundaries

**Impact:**
- Poor perceived performance
- Janky user experience
- No loading feedback

**Fix:** Add proper loading states and suspense boundaries

---

## 📋 **TECHNICAL DEBT PRIORITY MATRIX**

| Priority | Issue | Effort | Impact | Risk |
|----------|-------|---------|---------|------|
| 🔴 P0 | Build Configuration Bypasses | High | High | High |
| 🔴 P0 | Broken tRPC Type Safety | Medium | High | High |
| 🟡 P1 | Environment Validation | Low | Medium | Medium |
| 🟡 P1 | Path Import Inconsistency | Medium | Medium | Low |
| 🟡 P1 | Missing Service Integrations | High | High | Medium |
| 🟠 P2 | Type Casting Issues | Low | Medium | Medium |
| 🟠 P2 | Auth Import Updates | Medium | Medium | Medium |
| 🟠 P2 | Missing Error Boundaries | Medium | Medium | Low |
| 🔵 P3 | Rate Limiting Types | Low | Low | Low |
| 🔵 P3 | Missing Loading States | Medium | Low | Low |

---

## 🎯 **TECHNICAL DEBT RESOLUTION PLAN**

### **Phase 1: Critical Issues (Week 1)**
1. Fix build configuration bypasses
2. Restore tRPC type safety
3. Test thoroughly

### **Phase 2: High Priority (Week 2)**  
1. Fix environment validation
2. Standardize import paths
3. Configure missing services

### **Phase 3: Medium Priority (Week 3)**
1. Fix type casting issues
2. Review auth implementations
3. Add error boundaries

### **Phase 4: Polish (Week 4)**
1. Fix remaining type issues
2. Add loading states
3. Performance optimization

---

## 🔍 **MONITORING & PREVENTION**

### **Prevent Future Debt**
- [ ] Add pre-commit hooks for TypeScript/ESLint
- [ ] Set up CI/CD pipeline with quality gates
- [ ] Regular code review process
- [ ] Technical debt tracking in issues

### **Quality Gates**
- [ ] TypeScript compilation must pass
- [ ] ESLint validation must pass  
- [ ] Tests must pass
- [ ] Performance benchmarks must meet standards

### **Regular Audits**
- [ ] Weekly technical debt review
- [ ] Monthly security audit
- [ ] Quarterly performance review
- [ ] Semi-annual architecture review

---

**🎯 Goal:** Zero technical debt in production code by end of January 2025 