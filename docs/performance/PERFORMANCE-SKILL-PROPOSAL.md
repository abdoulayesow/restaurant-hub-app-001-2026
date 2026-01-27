# Performance Optimization Skill - Proposal

## Vision

A Claude Code skill that automatically analyzes and optimizes Next.js + Neon database applications for production-grade performance.

## What It Would Do

### 1. **Performance Audit** (`/perf audit`)

Scans your codebase and identifies:

```bash
$ /perf audit

🔍 Analyzing performance...

Database Issues:
  ❌ Using non-pooled Neon connection (-400ms per request)
  ⚠️  Missing statement_cache_size=0 in DATABASE_URL
  ✅ Prisma client properly configured

API Route Issues:
  ⚠️  5 routes missing 'use server' directive
  ❌ /api/inventory: N+1 query detected (3 queries → should be 1)
  ⚠️  /api/auth/session: No caching (called on every page)

Bundle Size Issues:
  ❌ Dashboard page: 2089 modules (should be < 500)
  ⚠️  Importing entire lucide-react library (use selective imports)
  ✅ Next.js Image optimization enabled

Performance Metrics:
  📊 Estimated TTFB: 4.5s → 500ms (9x improvement possible)
  📊 Estimated FCP: 8.2s → 2s (4x improvement possible)

Run '/perf fix' to auto-fix 8 issues
```

### 2. **Auto-Fix** (`/perf fix`)

Automatically applies safe performance optimizations:

- Converts DATABASE_URL to pooled connection
- Adds missing `revalidate` directives to API routes
- Fixes N+1 queries by adding `include` statements
- Optimizes imports (lucide-react, date-fns, etc.)
- Adds React.memo to expensive components
- Implements SWR for client-side caching

### 3. **Bundle Analysis** (`/perf bundle`)

```bash
$ /perf bundle /dashboard

📦 Analyzing /dashboard bundle...

Total size: 847 KB (gzipped: 234 KB)

Largest modules:
  1. react-dom (128 KB) - Required
  2. recharts (89 KB) - Consider lazy loading
  3. @prisma/client (67 KB) - Server-side only (good!)
  4. lucide-react (45 KB) - Use selective imports

Recommendations:
  • Lazy load Recharts: import dynamic from 'next/dynamic'
  • Change: import { User } from 'lucide-react'
    To: import User from 'lucide-react/dist/esm/icons/user'
  • Code split dashboard widgets with Suspense

Potential savings: 156 KB (-18%)
```

### 4. **Database Query Profiling** (`/perf db`)

Analyzes Prisma queries for optimization:

```typescript
// Before (N+1)
const users = await prisma.user.findMany()
const restaurants = await Promise.all(
  users.map(u => prisma.restaurant.findMany({ where: { userId: u.id } }))
)

// After (Optimized)
const users = await prisma.user.findMany({
  include: { restaurants: true }
})
```

### 5. **Caching Strategy** (`/perf cache`)

Suggests and implements caching:

```bash
$ /perf cache

🎯 Analyzing cacheable routes...

High-impact caching opportunities:

1. /api/inventory (1.2s avg, 45 req/min)
   → Add: export const revalidate = 60
   → Estimated savings: 54s/min total

2. /api/dashboard/stats (800ms avg, 120 req/min)
   → Add: export const revalidate = 300
   → Estimated savings: 96s/min total

3. GET /api/restaurants/my-restaurants
   → Implement SWR client-side (dedupe calls)

Apply all? (y/n)
```

## Implementation Plan

### Phase 1: Core Analysis (Week 1)
- Static analysis of Prisma queries
- DATABASE_URL validation
- Bundle size analysis via Next.js build output

### Phase 2: Auto-Fixes (Week 2)
- Safe transformations (DATABASE_URL, imports)
- Prisma query optimization
- Cache directive injection

### Phase 3: Advanced Features (Week 3)
- Real-time monitoring integration
- Load testing simulation
- Performance regression detection

## Technical Approach

### Tools to Use
- **@next/bundle-analyzer** - Bundle size analysis
- **Prisma AST parsing** - Query optimization detection
- **TypeScript Compiler API** - Import optimization
- **React Profiler API** - Component render analysis

### Skill Architecture

```typescript
// skills/performance/index.ts
export const performanceSkill = {
  commands: {
    'audit': auditPerformance,
    'fix': autoFix,
    'bundle': analyzeBundle,
    'db': profileDatabase,
    'cache': optimizeCaching,
  },

  hooks: {
    'pre-commit': checkPerformanceRegression,
    'pre-deploy': runFullAudit,
  }
}
```

## Example Usage Flow

```bash
# Developer notices slow load times
$ /perf audit

# Skill identifies 8 issues
# Developer reviews recommendations
$ /perf fix

# Skill applies 6 safe fixes, flags 2 for manual review
✅ DATABASE_URL updated to pooled connection
✅ Added statement_cache_size=0
✅ Optimized 3 Prisma queries
✅ Fixed 12 lucide-react imports
⚠️  Manual review needed: /api/inventory (breaking change possible)
⚠️  Manual review needed: Dashboard lazy loading (UX consideration)

# Developer tests changes
$ npm run dev
# Load time: 8.2s → 2.1s ✅

# Developer analyzes bundle
$ /perf bundle
# Identifies 156 KB savings opportunity

# Deploy with confidence
$ /perf check
✅ All performance checks passed
```

## Success Metrics

- **Time to First Byte (TTFB):** < 500ms (currently 4.5s)
- **First Contentful Paint (FCP):** < 2s (currently 8.2s)
- **Bundle Size:** Dashboard < 250 KB gzipped (currently 847 KB)
- **API Response Time:** Avg < 200ms (currently 1-6s)
- **Database Queries:** Max 2 per request (currently up to 4)

## Why This Skill?

### Current Pain Points
1. ❌ Manual performance audits take 2-3 hours
2. ❌ Easy to miss N+1 queries in reviews
3. ❌ Bundle analysis requires external tools
4. ❌ No automated performance regression detection
5. ❌ Database optimization requires Prisma expertise

### With This Skill
1. ✅ Automated audits in < 30 seconds
2. ✅ N+1 detection on every PR
3. ✅ Built-in bundle analysis
4. ✅ Pre-commit performance checks
5. ✅ Guided optimization with auto-fix

## Next Steps

1. **Validate concept** - Test core analysis logic
2. **Build MVP** - Implement `/perf audit` and `/perf fix`
3. **Test on Bakery Hub** - Use this codebase as reference
4. **Expand** - Add bundle analysis and caching strategies
5. **Publish** - Make available as Claude Code skill

## Immediate Action (No Skill Needed)

You can get 80% of the performance improvement **right now** by:

1. **Switch to pooled Neon connection** (see [NEON-OPTIMIZATION.md](./NEON-OPTIMIZATION.md))
   - Expected improvement: 4.5s → 500ms auth, 6.5s → 800ms API

2. **Add selective imports**
   ```typescript
   // Before
   import { User, Settings, LogOut } from 'lucide-react'

   // After
   import User from 'lucide-react/dist/esm/icons/user'
   import Settings from 'lucide-react/dist/esm/icons/settings'
   import LogOut from 'lucide-react/dist/esm/icons/log-out'
   ```

3. **Enable Neon autoscaling** (free, 1-click in console)

Would you like me to:
- [ ] Implement the pooled connection fix now
- [ ] Start building the performance skill
- [ ] Just keep this as future reference

