# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bakery inventory management web application for a bakery in Guinea (Conakry), managed remotely by the owner in Atlanta, USA. The core differentiator is **strong inventory management** with stock tracking, low-stock alerts, and restock predictions.

Based on the O'Takos Restaurant Dashboard reference application - see [docs/bakery-app-reference/](docs/bakery-app-reference/) for complete technical documentation.

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth (JWT sessions, email whitelist via ALLOWED_EMAILS env)
- **Styling**: Tailwind CSS with gold brand color (#D4AF37)
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: next-pwa
- **i18n**: Custom context-based (French primary, English secondary)

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma generate  # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio    # Open Prisma database GUI
```

## Architecture

### Directory Structure (Target)
```
app/                    # Next.js App Router pages and API routes
  api/                  # REST API endpoints
  (pages)/              # Page components
components/             # React components
hooks/                  # Custom React hooks
lib/                    # Utilities (prisma client, auth helpers, formatters)
config/                 # Configuration (routes, constants)
prisma/                 # Database schema and migrations
public/
  locales/              # Translation files (en.json, fr.json)
```

### Core Domain Models

- **InventoryItem**: Ingredients with stock levels, thresholds, units, costs
- **StockMovement**: Track purchases, usage, waste, adjustments
- **ProductionLog**: Daily production with ingredient usage
- **Expense**: Linked to inventory purchases
- **User**: Manager/Editor roles with different permissions

### Key Patterns

**Role-based access**: Manager (full access, approvals) vs Editor (submit only)

**Approval workflow**: Items start as Pending, Manager approves/rejects

**Multi-currency**: GNF (Guinean Franc) primary, EUR for reference

**Stock alerts**: Low stock (below minimum), critical (near zero), expiry warnings

## Design System

Gold theme (#D4AF37) with dark mode support. Key Tailwind patterns:

```tsx
// Card
"bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"

// Primary button
"px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700"

// Input
"w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 dark:bg-gray-700 dark:text-white"
```

Always pair light/dark mode classes. See [docs/bakery-app-reference/02-FRONTEND-DESIGN-SKILL.md](docs/bakery-app-reference/02-FRONTEND-DESIGN-SKILL.md) for complete design system.

## Internationalization

Translation files in `public/locales/{en,fr}.json`. Usage:
```typescript
const { t, locale, setLocale } = useLocale()
t('common.appName')  // Returns translated string
```

## Business Context

- **Location**: Conakry, Guinea
- **Owner**: Remote from Atlanta, USA
- **Currency**: GNF (Guinean Franc)
- **Languages**: French (default), English
- **Key pain point**: Real-time inventory visibility for remote owner
