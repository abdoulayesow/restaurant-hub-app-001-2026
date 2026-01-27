# Neon Database Performance Optimization

## Current Performance Issues

Based on dev logs, you're experiencing:
- Auth session: **4.5s** (should be < 500ms)
- Restaurant API: **6.5s** (should be < 1s)
- Dashboard load: **8.2s total** (should be < 3s)

## Root Causes

### 1. **Non-Pooled Database Connection**
Your current DATABASE_URL uses the direct connection string, which creates a new connection for every request.

### 2. **Solution: Use Neon's Pooled Connection**

Neon provides **two connection strings**:

#### ❌ Direct Connection (Current - SLOW)
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/bakery_hub?sslmode=require
```
- Creates new connection every time
- 200-500ms connection overhead per request
- Not suitable for serverless

#### ✅ Pooled Connection (Recommended - FAST)
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/bakery_hub?sslmode=require&pgbouncer=true&connect_timeout=10
```
- Uses PgBouncer connection pooler
- < 10ms connection overhead
- Perfect for Next.js/Vercel

## How to Fix (2 minutes)

### Step 1: Get Pooled Connection String

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "Connection Details"
4. **Toggle "Pooled connection"**
5. Copy the new connection string

![Neon Pooled Connection](https://neon.tech/docs/img/pooled-connection.png)

### Step 2: Update Your .env

Replace your current `DATABASE_URL` with the pooled version:

```env
# Before (SLOW)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/bakery_hub?sslmode=require"

# After (FAST)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/bakery_hub?sslmode=require&pgbouncer=true&connect_timeout=10"
```

**Key changes:**
- Endpoint changes from `ep-xxx.region.aws.neon.tech` to `ep-xxx-pooler.region.aws.neon.tech`
- Added `&pgbouncer=true`
- Added `&connect_timeout=10`

### Step 3: Update Vercel Environment Variable

If deployed on Vercel:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `DATABASE_URL` with the pooled connection string
3. Redeploy

### Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Auth session | 4.5s | < 500ms | **9x faster** |
| Restaurant API | 6.5s | < 800ms | **8x faster** |
| First page load | 8.2s | < 2s | **4x faster** |

## Additional Optimizations

### 1. Enable Neon Autoscaling (Free)

In Neon Console → Compute → Enable **Autoscaling**
- Scales from 0.25 CU to 4 CU based on load
- Reduces cold starts
- No additional cost for Hobby tier

### 2. Set Neon Compute to "Always Ready" (During Development)

In Neon Console → Compute Settings:
- **Suspend compute after:** Set to "Never" during active development
- This eliminates 1-2s cold start delays
- Remember to set back to "5 minutes" when done to save resources

### 3. Use Connection Pooling Parameters

Add these to your DATABASE_URL:

```
?sslmode=require&pgbouncer=true&connect_timeout=10&pool_timeout=10&statement_cache_size=0
```

**Parameters explained:**
- `pgbouncer=true` - Enable PgBouncer mode (required for pooled connection)
- `connect_timeout=10` - Max 10s to establish connection
- `pool_timeout=10` - Max 10s to get connection from pool
- `statement_cache_size=0` - Disable prepared statement cache (required for PgBouncer)

## Prisma-Specific Optimizations

### 1. Use Prisma Accelerate (Optional - Paid)

[Prisma Accelerate](https://www.prisma.io/accelerate) adds global caching:
- 10-100x faster for read-heavy queries
- $25/month for production use
- Free trial available

### 2. Enable Query Logging in Dev Only

Already implemented in `lib/prisma.ts`:
```typescript
log: process.env.NODE_ENV === 'development'
  ? ['query', 'error', 'warn']
  : ['error'],
```

This prevents performance overhead in production.

## Monitoring Performance

### 1. Neon Monitoring Tab

Check your Neon Console → Monitoring for:
- Connection count (should be < 10 most times)
- Query duration (avg should be < 100ms)
- CPU usage

### 2. Vercel Analytics

Add Vercel Speed Insights:
```bash
npm install @vercel/speed-insights
```

Then in `app/layout.tsx`:
```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

## Troubleshooting

### Issue: "prepared statement already exists"

**Solution:** Add `statement_cache_size=0` to DATABASE_URL

### Issue: "too many clients"

**Cause:** Direct connection (non-pooled)
**Solution:** Use pooled connection string

### Issue: Still slow after changing to pooled connection

1. Verify endpoint has `-pooler` in URL
2. Check `pgbouncer=true` is in URL
3. Restart dev server
4. Clear `.next` folder: `rm -rf .next`

## Future Optimization: Caching

For read-heavy routes (dashboard, inventory list), consider:

### 1. React Server Components (Already Using)
✅ You're using RSC - great for reducing bundle size

### 2. Next.js Route Cache
Add to frequently-accessed API routes:
```typescript
export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  // ... your code
}
```

### 3. SWR for Client-Side Data
Already using hooks - consider adding SWR:
```bash
npm install swr
```

```tsx
import useSWR from 'swr'

function InventoryPage() {
  const { data, error } = useSWR('/api/inventory', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10s
  })
}
```

## Checklist

Before deploying to production:

- [ ] Using Neon pooled connection string
- [ ] `pgbouncer=true` in DATABASE_URL
- [ ] Neon autoscaling enabled
- [ ] Vercel environment variables updated
- [ ] Tested locally with pooled connection
- [ ] Verified query logs show < 100ms avg query time
- [ ] Removed debug logging (`prisma:query`) in production

## References

- [Neon Pooling Guide](https://neon.tech/docs/connect/connection-pooling)
- [Prisma + Neon Best Practices](https://www.prisma.io/docs/guides/database/neon)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
