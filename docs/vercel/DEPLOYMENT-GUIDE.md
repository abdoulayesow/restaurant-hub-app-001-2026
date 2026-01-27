# Vercel Deployment Guide

> **Status**: Production Ready
> **Last Updated**: 2026-01-08
> **Framework**: Next.js 15+ with App Router

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

Before clicking "Deploy", add these environment variables (see [Section 4](#4-environment-variables) for details):

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate-secure-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
ALLOWED_EMAILS=owner@email.com,manager@email.com
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

### Step 2: Get Connection Strings

In Neon dashboard, go to **Connection Details**:

```bash
# Pooled connection (for app)
DATABASE_URL=postgresql://user:password@ep-xxx.eu-west-1.aws.neon.tech/neondb?sslmode=require

# Direct connection (for migrations)
DIRECT_URL=postgresql://user:password@ep-xxx.eu-west-1.aws.neon.tech/neondb?sslmode=require
```

> ⚠️ **Important**: Use the pooled connection URL for `DATABASE_URL` and direct connection for `DIRECT_URL` (migrations).

### Step 3: Run Migrations

After deployment, run migrations from your local machine:

```bash
# Set environment variables locally
export DATABASE_URL="your-pooled-url"
export DIRECT_URL="your-direct-url"

# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npm run db:seed
```

Or use Vercel CLI:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### Alternative: Vercel Postgres

If you prefer Vercel's built-in database:

1. Go to Project Settings → Storage
2. Click "Create Database" → Postgres
3. Environment variables are automatically added
4. Note: Vercel Postgres uses `POSTGRES_*` prefixed variables

---

## 4. Environment Variables

### Production Environment Variables

Go to **Project Settings → Environment Variables** and add:

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview |
| `DIRECT_URL` | `postgresql://...` | Production, Preview |
| `NEXTAUTH_URL` | `https://yourdomain.com` | Production only |
| `NEXTAUTH_URL` | `https://your-preview.vercel.app` | Preview only |
| `NEXTAUTH_SECRET` | `<32+ char secret>` | All |
| `GOOGLE_CLIENT_ID` | `<from Google Cloud>` | All |
| `GOOGLE_CLIENT_SECRET` | `<from Google Cloud>` | All |
| `ALLOWED_EMAILS` | `user1@email.com,user2@email.com` | All |

### Generate NEXTAUTH_SECRET

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Go to **APIs & Services → Credentials**
4. Create **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized origins: `https://yourdomain.com`
   - Authorized redirect URIs: 
     - `https://yourdomain.com/api/auth/callback/google`
     - `https://your-app.vercel.app/api/auth/callback/google`
5. Copy Client ID and Client Secret

### Optional: SMS Variables (for notifications)

| Variable | Value |
|----------|-------|
| `TWILIO_ACCOUNT_SID` | `<from Twilio>` |
| `TWILIO_AUTH_TOKEN` | `<from Twilio>` |
| `TWILIO_PHONE_NUMBER` | `+1234567890` |
| `CRON_SECRET` | `<random-string>` |
| `SMS_NOTIFICATIONS_ENABLED` | `true` |

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

**Solution**: Check connection string format and SSL:

```bash
# Correct format for Neon
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
```

#### "NEXTAUTH_URL missing" Warning

**Solution**: Ensure `NEXTAUTH_URL` matches your actual deployment URL:

```bash
# For production
NEXTAUTH_URL=https://yourdomain.com

# For preview (auto-set by Vercel if not specified)
NEXTAUTH_URL=https://your-branch-project.vercel.app
```

#### OAuth Callback Error

**Solution**: Add all deployment URLs to Google OAuth:
- `https://yourdomain.com/api/auth/callback/google`
- `https://project.vercel.app/api/auth/callback/google`
- `https://*.vercel.app/api/auth/callback/google` (for previews)

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

4. **Database Connection Pooling**: Use Prisma's connection pooling
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
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

### Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Dashboard](https://console.neon.tech)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

---

## Deployment Checklist

### Before First Deploy

- [ ] Repository connected to Vercel
- [ ] Neon database created
- [ ] Environment variables configured
- [ ] Google OAuth set up
- [ ] NEXTAUTH_SECRET generated
- [ ] ALLOWED_EMAILS configured

### After Deploy

- [ ] Verify app loads correctly
- [ ] Test Google login
- [ ] Run database migrations
- [ ] Seed initial data (if needed)
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring

### Production Hardening

- [ ] Enable Vercel Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Review security headers
- [ ] Test PWA functionality
- [ ] Verify cron jobs
