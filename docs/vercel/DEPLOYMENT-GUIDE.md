# Vercel Deployment Guide

> **Status**: Production Ready
> **Last Updated**: 2026-01-31
> **Framework**: Next.js 15+ with App Router

---

## Quick Start (5 Minutes)

For experienced developers who want the essentials:

1. **Create accounts**: [Vercel](https://vercel.com), [Neon](https://neon.tech), [Google Cloud](https://console.cloud.google.com)
2. **Set up Google OAuth**: Create OAuth credentials, get Client ID & Secret
3. **Create Neon database**: Get pooled connection URL
4. **Deploy to Vercel**: Import GitHub repo
5. **Add environment variables**:
   ```bash
   DATABASE_URL=<neon-pooled-url>
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=<openssl rand -base64 32>
   GOOGLE_CLIENT_ID=<from-google>
   GOOGLE_CLIENT_SECRET=<from-google>
   ALLOWED_EMAILS=owner@example.com
   ```
6. **Deploy and run migrations**:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```
7. **Test**: Visit app, sign in with Google

For detailed step-by-step instructions, continue reading below.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Initial Deployment](#2-initial-deployment)
3. [Database Setup (Neon Postgres)](#3-database-setup-neon-postgres)
4. [Environment Variables](#4-environment-variables)
5. [Domain Configuration](#5-domain-configuration)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Cron Jobs](#7-cron-jobs)
8. [Monitoring & Analytics](#8-monitoring--analytics)
9. [Troubleshooting](#9-troubleshooting)
10. [Cost Optimization](#10-cost-optimization)

---

## 1. Prerequisites

Before deploying, ensure you have:

- [ ] **Vercel Account**: [Sign up at vercel.com](https://vercel.com/signup)
- [ ] **GitHub Repository**: Code pushed to GitHub
- [ ] **Google OAuth Credentials**: For authentication
- [ ] **Database**: Neon Postgres (recommended) or Vercel Postgres

### Required Accounts

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| Vercel | Hosting | Yes (Hobby) |
| Neon | Database | Yes (0.5 GB) |
| Google Cloud | OAuth | Free |
| Twilio (optional) | SMS | Trial credits |

---

## 2. Initial Deployment

### Step 1: Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `restaurant-hub-app-001-2026`
4. Click **"Import"**

### Step 2: Configure Project

In the configuration screen:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `./` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm ci` |

### Step 3: Add Environment Variables

**Important**: Do NOT deploy yet. Add environment variables first (see [Section 4](#4-environment-variables) for details):

**Required variables to add:**
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
ALLOWED_EMAILS=owner@email.com,manager@email.com
```

**Optional variables:**
```
CRON_SECRET=<generate with: openssl rand -base64 32>
SMS_NOTIFICATIONS_ENABLED=false
```

### Step 4: Deploy

Click **"Deploy"** and wait for the build to complete (~2-3 minutes).

---

## 3. Database Setup (Neon Postgres)

### Why Neon?

- **Free tier**: 0.5 GB storage, 3 GB compute hours/month
- **Serverless**: Auto-scales, auto-suspends
- **Branching**: Create database branches for testing
- **Vercel integration**: One-click connection

### Step 1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended)
3. Create a new project: `bakery-hub-production`
4. Select region: **Europe West (eu-west-1)** for lower latency to Guinea

### Step 2: Integrate with Vercel (Recommended)

**Option A: One-Click Integration** (Easiest)

1. In your Vercel project, go to **Storage → Connect Database**
2. Select **Neon Postgres**
3. Authenticate with your Neon account
4. Select your database project
5. Click **Connect** - Environment variables are automatically added

**Option B: Manual Setup**

In Neon dashboard, go to **Connection Details**:

1. Enable **Pooled connection** toggle
2. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx-pooler.eu-west-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   ```
3. Add to Vercel as `DATABASE_URL` environment variable

> ⚠️ **Important**: Use the **pooled** connection (with `-pooler` in hostname) for better performance with serverless functions.

### Step 3: Run Migrations

After deployment, run migrations using Vercel CLI:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables (includes DATABASE_URL)
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database with initial data
npm run db:seed
```

**Alternative**: Run from production environment (after first deploy):
```bash
# SSH into Vercel function (not recommended for migrations)
# Better to use Vercel CLI or run locally with production DATABASE_URL
```

### Alternative: Vercel Postgres

If you prefer Vercel's built-in database:

1. Go to **Project Settings → Storage**
2. Click **"Create Database" → Postgres**
3. Select region (choose closest to Guinea/West Africa for lower latency)
4. Environment variables are automatically added
5. Note: Vercel Postgres uses `POSTGRES_*` prefixed variables

**Comparison: Neon vs Vercel Postgres**

| Feature | Neon | Vercel Postgres |
|---------|------|-----------------|
| Free Tier | 0.5 GB storage, 3 compute hours | Limited storage |
| Auto-scaling | Yes | Yes |
| Branching | Yes (database branches) | No |
| Price (paid) | From $19/month | From $20/month |
| Integration | One-click | Native |

**Recommendation**: Use **Neon** for better free tier and database branching features.

---

## 4. Environment Variables

### Required Environment Variables

Go to **Project Settings → Environment Variables** in Vercel and add these **required** variables:

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `DATABASE_URL` | `postgresql://...` | All | Neon Postgres connection (auto-added if using integration) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production | Your production URL |
| `NEXTAUTH_URL` | Auto-set by Vercel | Preview | Leave empty for preview deploys |
| `NEXTAUTH_SECRET` | Generate (see below) | All | JWT encryption secret (32+ characters) |
| `GOOGLE_CLIENT_ID` | From Google Cloud | All | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud | All | OAuth 2.0 Client Secret |
| `ALLOWED_EMAILS` | `user1@email.com,user2@email.com` | All | Comma-separated list of authorized emails |

### Optional Environment Variables (for additional features)

| Variable | Value | Default | Description |
|----------|-------|---------|-------------|
| `CRON_SECRET` | Generate (see below) | - | Secures cron job endpoints |
| `SMS_NOTIFICATIONS_ENABLED` | `true` or `false` | `false` | Enable SMS notifications |
| `TWILIO_ACCOUNT_SID` | From Twilio | - | Required if SMS enabled |
| `TWILIO_AUTH_TOKEN` | From Twilio | - | Required if SMS enabled |
| `TWILIO_PHONE_NUMBER` | `+1234567890` | - | Required if SMS enabled |

### How to Generate Secrets

**NEXTAUTH_SECRET** (Required):
```bash
# Method 1: Using OpenSSL (recommended)
openssl rand -base64 32

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

**CRON_SECRET** (Optional - same method as above)

Copy the output and paste it into Vercel as the environment variable value.

### Google OAuth Setup (Required)

Follow these steps to set up Google authentication:

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select an existing one

2. **Enable Google+ API** (if not already enabled)
   - Go to **APIs & Services → Library**
   - Search for "Google+ API"
   - Click **Enable**

3. **Create OAuth Credentials**
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth 2.0 Client ID**

4. **Configure OAuth Consent Screen** (if first time)
   - User Type: **External**
   - App name: `Bakery Hub` (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**

5. **Configure OAuth Client**
   - Application type: **Web application**
   - Name: `Bakery Hub Production`
   - **Authorized JavaScript origins:**
     - `https://your-app.vercel.app`
     - `https://yourdomain.com` (if using custom domain)
   - **Authorized redirect URIs:**
     - `https://your-app.vercel.app/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (if using custom domain)

6. **Get Credentials**
   - Click **Create**
   - Copy the **Client ID** → Add to Vercel as `GOOGLE_CLIENT_ID`
   - Copy the **Client Secret** → Add to Vercel as `GOOGLE_CLIENT_SECRET`

> ⚠️ **Important for Preview Deployments**: To test OAuth on preview deployments, add `https://*.vercel.app/api/auth/callback/google` to authorized redirect URIs.

### ALLOWED_EMAILS Configuration (Required)

This variable controls who can sign in to your application:

```bash
# Single user
ALLOWED_EMAILS=owner@example.com

# Multiple users (comma-separated, no spaces after commas)
ALLOWED_EMAILS=owner@example.com,manager@example.com,staff@example.com

# Leave empty to allow all Google accounts (NOT recommended for production)
ALLOWED_EMAILS=
```

**How it works:**
1. User signs in with Google OAuth
2. App checks if their email is in `ALLOWED_EMAILS`
3. If yes → Create/login user account
4. If no → Show "Access Denied" error

**To add new users:**
1. Go to Vercel → Project Settings → Environment Variables
2. Edit `ALLOWED_EMAILS`
3. Add new email to comma-separated list
4. Redeploy or wait for automatic redeployment

---

## 5. Domain Configuration

### Using Vercel Domain (Free)

Your app is automatically available at:
- `https://project-name.vercel.app`

### Custom Domain Setup

1. Go to **Project Settings → Domains**
2. Add your domain: `bakeryhub.yourdomain.com`
3. Update DNS records:

| Type | Name | Value |
|------|------|-------|
| CNAME | bakeryhub | cname.vercel-dns.com |

Or for apex domain (yourdomain.com):

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |

4. Wait for DNS propagation (5 mins - 48 hours)
5. SSL is automatically provisioned

### Update NEXTAUTH_URL

After adding custom domain, update environment variable:

```bash
NEXTAUTH_URL=https://bakeryhub.yourdomain.com
```

### Update Google OAuth

Add your custom domain to Google OAuth authorized origins and redirect URIs.

---

## 6. CI/CD Pipeline

### GitHub Integration

Vercel automatically:
- **Production Deploy**: On push to `main` branch
- **Preview Deploy**: On pull requests

### Current Configuration

The project already has a `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, must-revalidate" }
      ]
    }
  ]
}
```

### GitHub Actions (Existing CI)

The project has CI at `.github/workflows/ci.yml`:

```yaml
# Runs on every push/PR:
# - Linting
# - Type checking
# - Build verification
```

### Protected Branches (Recommended)

In GitHub repository settings:
1. Go to **Settings → Branches**
2. Add rule for `main`:
   - Require status checks before merging
   - Require branches to be up to date

---

## 7. Cron Jobs

### Setting Up Scheduled Tasks

> **Note:** The cron endpoints shown below are examples for after you implement SMS notifications following the [SMS-NOTIFICATIONS.md](../sms/SMS-NOTIFICATIONS.md) guide. These endpoints need to be created first before adding them to vercel.json.

**Example Cron Configuration** (After SMS Implementation):

Update `vercel.json` to add cron jobs:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "devCommand": "npm run dev",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, must-revalidate" }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/cron/daily-notifications",
      "schedule": "0 18 * * *"
    }
  ]
}
```

> **Implementation Required:** See [SMS-NOTIFICATIONS.md Section 5-6](../sms/SMS-NOTIFICATIONS.md#step-6-add-cron-job-for-scheduled-notifications) for creating the cron endpoint.

### Cron Schedule Reference

| Schedule | Description |
|----------|-------------|
| `0 18 * * *` | Daily at 6 PM UTC (6 PM in Guinea) |
| `0 22 * * *` | Daily at 10 PM UTC (10 PM in Guinea) |
| `0 8 * * 1` | Every Monday at 8 AM UTC |
| `*/15 * * * *` | Every 15 minutes |

### Securing Cron Endpoints

Add authentication to cron routes:

```typescript
// app/api/cron/daily-notifications/route.ts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  // Vercel adds this header automatically for cron jobs
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // ... cron job logic
}
```

### Vercel Cron Limits

| Plan | Cron Jobs | Max Frequency |
|------|-----------|---------------|
| Hobby | 2 | Daily |
| Pro | 40 | Every minute |
| Enterprise | Unlimited | Every minute |

---

## 8. Monitoring & Analytics

### Vercel Analytics (Built-in)

1. Go to **Project → Analytics**
2. Enable Web Analytics (free)
3. Add to `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Speed Insights

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

### Function Logs

View real-time logs:
- Go to **Project → Logs**
- Filter by function, time, status

### Error Tracking (Recommended: Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Uptime Monitoring

Free options:
- [Better Uptime](https://betteruptime.com) - 5 monitors free
- [UptimeRobot](https://uptimerobot.com) - 50 monitors free
- [Checkly](https://www.checklyhq.com) - 5 checks free

---

## 9. Troubleshooting

### Common Deployment Issues

#### Build Fails: "Prisma Client not generated"

**Solution**: The `postinstall` script should run automatically, but if not:

```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

#### Build Fails: "Cannot find module '@prisma/client'"

**Solution**: Ensure Prisma is in `dependencies`, not `devDependencies`:

```json
{
  "dependencies": {
    "@prisma/client": "^6.2.1"
  },
  "devDependencies": {
    "prisma": "^6.2.1"
  }
}
```

#### Database Connection Errors

**Solution 1**: Check connection string format and SSL:

```bash
# Correct format for Neon (pooled connection)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Must include:
# - "-pooler" in hostname for connection pooling
# - "sslmode=require" for SSL
# - "pgbouncer=true" for serverless compatibility
```

**Solution 2**: Check if Prisma is configured correctly:

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}
```

**Solution 3**: Verify environment variable is set:
- Go to Vercel → Project Settings → Environment Variables
- Ensure `DATABASE_URL` exists for Production and Preview environments
- Redeploy after adding/updating

#### "NEXTAUTH_URL missing" Warning

**Solution**: Ensure `NEXTAUTH_URL` matches your actual deployment URL:

```bash
# For production
NEXTAUTH_URL=https://yourdomain.com

# For preview (auto-set by Vercel if not specified)
NEXTAUTH_URL=https://your-branch-project.vercel.app
```

#### OAuth Callback Error

**Error**: "Error: redirect_uri_mismatch" or "Access Denied"

**Solution**: Add all deployment URLs to Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add these to **Authorized redirect URIs**:
   - `https://yourdomain.com/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`
   - `https://*.vercel.app/api/auth/callback/google` (for preview deployments)
4. Click **Save**
5. Wait 5 minutes for changes to propagate
6. Try signing in again

#### "Access Denied" After Successful Google Login

**Solution**: Check `ALLOWED_EMAILS` configuration:
1. Verify the email you're signing in with is in `ALLOWED_EMAILS`
2. Check for typos or extra spaces
3. Format should be: `email1@domain.com,email2@domain.com` (no spaces)
4. Redeploy after updating

#### Build Succeeds But App Shows 500 Error

**Solution**: Check runtime logs:
```bash
vercel logs your-app.vercel.app --follow
```

Common causes:
- Missing environment variables (check `NEXTAUTH_SECRET`)
- Database connection issues (check `DATABASE_URL`)
- Prisma client not generated (should auto-generate, but run `npx prisma generate` if needed)

#### Environment Variables Not Working

**Solution**:
1. Verify variables are set for the correct environment (Production/Preview/Development)
2. After adding/updating variables, you MUST redeploy:
   ```bash
   # Trigger redeploy
   git commit --allow-empty -m "Redeploy"
   git push
   ```
3. Check variable names are exactly correct (case-sensitive)

### Viewing Logs

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs your-project.vercel.app

# Stream logs in real-time
vercel logs your-project.vercel.app --follow
```

### Rolling Back Deployments

1. Go to **Project → Deployments**
2. Find a working deployment
3. Click **"..." → "Promote to Production"**

---

## 10. Cost Optimization

### Vercel Pricing (2026)

| Plan | Price | Serverless Functions | Bandwidth |
|------|-------|---------------------|-----------|
| Hobby | Free | 100 GB-Hrs | 100 GB |
| Pro | $20/user/month | 1000 GB-Hrs | 1 TB |

### Database Costs (Neon)

| Plan | Price | Storage | Compute |
|------|-------|---------|---------|
| Free | $0 | 0.5 GB | 3 compute-hours |
| Launch | $19/month | 10 GB | 300 compute-hours |

### Optimization Tips

1. **Edge Functions**: Use edge runtime for lightweight API routes
   ```typescript
   export const runtime = 'edge'
   ```

2. **Image Optimization**: Use Next.js Image component
   ```tsx
   import Image from 'next/image'
   ```

3. **Caching**: Implement proper caching headers
   ```typescript
   return NextResponse.json(data, {
     headers: {
       'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
     }
   })
   ```

4. **Database Connection Pooling**: Ensure using pooled connection
   ```bash
   # Use pooled connection URL (with -pooler suffix)
   DATABASE_URL="postgresql://...@ep-xxx-pooler.neon.tech/...?pgbouncer=true"
   ```

   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

5. **Static Generation**: Pre-render pages where possible
   ```typescript
   export const dynamic = 'force-static'
   ```

### Monitoring Costs

- **Vercel**: Project Settings → Usage
- **Neon**: Dashboard → Usage

---

## Quick Reference

### Vercel CLI Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables
vercel env pull .env.local

# View logs
vercel logs

# List deployments
vercel ls

# Alias a deployment
vercel alias <deployment-url> <custom-domain>
```

### Environment Variable Management

```bash
# Add variable
vercel env add VARIABLE_NAME

# Remove variable
vercel env rm VARIABLE_NAME

# List variables
vercel env ls
```

### Verifying Deployment Success

Run through this checklist to ensure everything works:

**1. Basic Functionality**
```bash
# Visit your deployed URL
https://your-app.vercel.app

# Expected: Login page loads without errors
# Check browser console (F12) for errors
```

**2. Authentication Test**
- Click "Sign in with Google"
- Expected: Redirects to Google OAuth
- Sign in with an email in `ALLOWED_EMAILS`
- Expected: Redirects back and creates session
- Check if you see the dashboard

**3. Database Connection Test**
- Try creating a test restaurant (if you have access)
- Expected: No errors, data saves successfully
- Check Neon dashboard → Tables → Verify data appears

**4. API Endpoints Test**
```bash
# Test a protected API endpoint
curl https://your-app.vercel.app/api/restaurants/my-restaurants

# Without auth, should return 401
# With auth (via browser session), should return data
```

**5. Environment Variables Verification**
```bash
# Use Vercel CLI to check
vercel env ls

# Verify all required variables are present:
# - DATABASE_URL
# - NEXTAUTH_URL
# - NEXTAUTH_SECRET
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - ALLOWED_EMAILS
```

**6. Logs Check**
```bash
# Check for runtime errors
vercel logs your-app.vercel.app --follow

# Should see normal traffic, no error traces
```

### Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Dashboard](https://console.neon.tech)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Google Cloud Console](https://console.cloud.google.com)
- [NextAuth.js Docs](https://next-auth.js.org)

---

## Deployment Checklist

### Pre-Deployment Setup

- [ ] **Vercel Account** - Create account at [vercel.com](https://vercel.com/signup)
- [ ] **GitHub Repository** - Code pushed to GitHub and accessible
- [ ] **Neon Database** - Create account and project at [neon.tech](https://neon.tech)
- [ ] **Google OAuth** - Set up OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)

### Environment Variables Setup

- [ ] **DATABASE_URL** - Get from Neon (use pooled connection)
- [ ] **NEXTAUTH_URL** - Set to your production URL (e.g., `https://your-app.vercel.app`)
- [ ] **NEXTAUTH_SECRET** - Generate with `openssl rand -base64 32`
- [ ] **GOOGLE_CLIENT_ID** - Copy from Google Cloud Console
- [ ] **GOOGLE_CLIENT_SECRET** - Copy from Google Cloud Console
- [ ] **ALLOWED_EMAILS** - Add comma-separated list of authorized emails
- [ ] **CRON_SECRET** (Optional) - Generate with `openssl rand -base64 32`

### Initial Deployment

- [ ] Connect repository to Vercel
- [ ] Add all required environment variables
- [ ] Deploy and verify build succeeds
- [ ] Check deployment logs for errors

### Post-Deployment Configuration

- [ ] **Database Migrations**
  ```bash
  vercel env pull .env.local
  npx prisma migrate deploy
  ```
- [ ] **Test Authentication**
  - Visit deployed URL
  - Click "Sign in with Google"
  - Verify login works with allowed email
  - Verify rejected for non-allowed email
- [ ] **Test Core Features**
  - Create test restaurant
  - Add test data (inventory, sales, expenses)
  - Verify dark mode works
  - Test language switching (EN/FR)
- [ ] **Mobile/PWA Testing**
  - Test on mobile device
  - Verify "Add to Home Screen" prompt
  - Test offline functionality

### Production Hardening (Recommended)

- [ ] **Custom Domain**
  - Add domain in Vercel settings
  - Update DNS records
  - Update `NEXTAUTH_URL` environment variable
  - Update Google OAuth authorized URIs
- [ ] **Monitoring**
  - Enable Vercel Analytics
  - Set up error tracking (Sentry)
  - Configure uptime monitoring (UptimeRobot, Better Uptime)
- [ ] **Security**
  - Review security headers in `vercel.json`
  - Enable two-factor auth on Vercel account
  - Rotate secrets regularly
  - Review Vercel access logs
- [ ] **Performance**
  - Check Vercel Speed Insights
  - Review database query performance in Neon
  - Monitor function execution times
- [ ] **Backup**
  - Enable Neon point-in-time recovery
  - Test database restore process
  - Document recovery procedures

### Optional Features

- [ ] **SMS Notifications** (if needed)
  - Create Twilio account
  - Add Twilio environment variables
  - Set `SMS_NOTIFICATIONS_ENABLED=true`
  - Test notifications
- [ ] **Cron Jobs** (if needed)
  - Create cron endpoints
  - Add to `vercel.json`
  - Test cron execution
- [ ] **Multi-Restaurant** (if managing multiple locations)
  - Set up additional restaurants in database
  - Assign users to restaurants
  - Test restaurant switching

### Pre-Launch Final Checks

- [ ] All environment variables configured correctly
- [ ] Database migrations applied
- [ ] Google OAuth working for all authorized users
- [ ] No console errors in browser
- [ ] Mobile-responsive on all pages
- [ ] Dark mode works correctly
- [ ] French translations complete
- [ ] Error pages (404, 500) display correctly
- [ ] PWA installable on mobile
- [ ] Performance metrics acceptable (< 3s load time)

### Launch Day

- [ ] Announce to team
- [ ] Monitor Vercel logs for errors
- [ ] Monitor database performance in Neon
- [ ] Have rollback plan ready (previous deployment ID)
- [ ] Be available for immediate fixes if needed
