# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bakery Hub** - Bakery inventory management web application for a bakery in Guinea (Conakry), managed remotely by the owner in Atlanta, USA. The core differentiator is **strong inventory management** with stock tracking, low-stock alerts, and restock predictions.

## Documentation

- **Product Vision & MVP**: [docs/product/PRODUCT-VISION.md](docs/product/PRODUCT-VISION.md)
- **Technical Specification**: [docs/product/TECHNICAL-SPEC.md](docs/product/TECHNICAL-SPEC.md)
- **Feature Requirements (Jan 2026)**: [docs/product/FEATURE-REQUIREMENTS-JAN2026.md](docs/product/FEATURE-REQUIREMENTS-JAN2026.md)
- **Bank Transaction Unification**: [docs/product/BANK-TRANSACTION-UNIFICATION.md](docs/product/BANK-TRANSACTION-UNIFICATION.md) *(In Progress)*
- **Role-Based Access Control**: [docs/product/ROLE-BASED-ACCESS-CONTROL.md](docs/product/ROLE-BASED-ACCESS-CONTROL.md) *(Planned)*
- **Reference Application**: [docs/bakery-app-reference/](docs/bakery-app-reference/)
- **Design System**: [docs/bakery-app-reference/02-FRONTEND-DESIGN-SKILL.md](docs/bakery-app-reference/02-FRONTEND-DESIGN-SKILL.md)

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth (JWT sessions, email whitelist via ALLOWED_EMAILS env)
- **Styling**: Tailwind CSS with terracotta brand color (#C45C26), multi-palette support
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
- **Product**: Bakery products (Patisserie/Boulangerie) with recipes
- **ProductionLog**: Daily production with product types and ingredient usage
- **ProductionItem**: Junction table linking products to production logs
- **Sale**: Daily sales with payment breakdown and optional product tracking
- **SaleItem**: Optional product-level sales data (product, quantity, price)
- **Expense**: Linked to inventory purchases with fixed payment methods
- **User**: Manager/Editor roles with different permissions

### Key Patterns

**Role-based access**: Currently Manager vs Editor. See [ROLE-BASED-ACCESS-CONTROL.md](docs/product/ROLE-BASED-ACCESS-CONTROL.md) for planned role expansion:
- **Owner**: Full access to all pages (analytics, approvals, settings)
- **RestaurantManager**: Can record production, sales, expenses
- **Baker/Pastry Chef**: Can record production only
- **Cashier**: Can record sales and expenses only
- All employees access `/editor` pages only; Owner accesses everything except `/editor`

**Approval workflow**: Items start as Pending, Manager approves/rejects

**Multi-currency**: GNF (Guinean Franc) primary, EUR for reference

**Payment methods**: Fixed to 3 methods only - Cash, Orange Money, Card

**Production types**: Patisserie and Boulangerie with product catalogs

**Stock alerts**: Low stock (below minimum), critical (near zero), expiry warnings

**Sales constraints**: One sale per restaurant per date (no duplicates)

**Bank Transaction Workflow**: Bank transactions are created when money physically moves, not when records are created. See [BANK-TRANSACTION-UNIFICATION.md](docs/product/BANK-TRANSACTION-UNIFICATION.md) for details.

**When Bank Transactions Are Created:**

| Action | Creates Bank Transaction? | Type |
|--------|--------------------------|------|
| Record a sale | ❌ No | - |
| Record an expense | ❌ No | - |
| Record a debt | ❌ No | - |
| Deposit sales cash to bank | ✅ Yes | Deposit (Pending) |
| Collect debt payment | ✅ Yes | Deposit (Pending) |
| Pay an expense | ✅ Yes | Withdrawal (Pending) |
| Manual entry from Bank page | ✅ Yes | Deposit/Withdrawal (Pending) |

**Transaction Types by Source:**

| Source | Created By | Editable? | Deletable? |
|--------|-----------|-----------|------------|
| Sales deposit | Staff (from Sales page) | View only | No |
| Debt collection | Staff (from Debts page) | View only | No |
| Expense payment | Staff (from Expenses page) | View only | No |
| Manual entry | Owner (from Bank page) | Yes, until confirmed | Yes, until confirmed |

**Confirmation Workflow:**
1. Staff/Owner creates transaction → Status: `Pending`
2. Owner reviews and confirms via modal form → Status: `Confirmed`
3. Once confirmed: view-only (no edit/delete)

### Multi-Restaurant Support

Users can be assigned to multiple restaurants via the `UserRestaurant` junction table.

**Restaurant Switching:**
- Restaurant selector always visible in header (shows current restaurant name)
- Dropdown only appears if user has access to multiple restaurants
- Each restaurant has a unique accent color from the preset palette
- Toast notification confirms restaurant switch
- Data automatically refreshes when switching

**Color Palettes by Restaurant Index:**
| Index | Palette | Primary Color |
|-------|---------|---------------|
| 0 | Terracotta | #C45C26 |
| 1 | Warm Brown | #8B4513 |
| 2 | Burnt Sienna | #A0522D |
| 3 | Classic Gold | #D4AF37 |

**Context Hooks:**
```typescript
const { currentRestaurant, currentPalette, setCurrentRestaurant } = useRestaurant()
// currentPalette: 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'
```

## Design System

Terracotta theme (#C45C26) as default, with four preset palettes for multi-restaurant support. Dark mode fully supported using warm `stone-*` palette (not `gray-*`). Key Tailwind patterns:

```tsx
// Card
"bg-white dark:bg-stone-800 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 p-6"

// Primary button
"px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700"

// Input
"w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-gold-500 dark:bg-stone-700 dark:text-stone-100"

// Text colors
"text-stone-900 dark:text-stone-100"  // Primary text
"text-stone-600 dark:text-stone-400"  // Secondary text
"text-stone-500 dark:text-stone-400"  // Muted text

// Semantic colors (use emerald for success, not green)
"text-emerald-600 dark:text-emerald-400"  // Success/confirm actions
"text-red-600 dark:text-red-400"          // Error/destructive actions
```

Always pair light/dark mode classes. Use `stone-*` for dark mode backgrounds and borders (warm bakery aesthetic). See [docs/bakery-app-reference/02-FRONTEND-DESIGN-SKILL.md](docs/bakery-app-reference/02-FRONTEND-DESIGN-SKILL.md) for complete design system.

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
- **Payment Methods**: Cash, Orange Money, Card (fixed - no custom methods)
- **Production Types**: Patisserie (croissants, pastries) and Boulangerie (breads, baguettes)
- **Key pain point**: Real-time inventory visibility for remote owner

## Pending Features (January 2026)

See [FEATURE-REQUIREMENTS-JAN2026.md](docs/product/FEATURE-REQUIREMENTS-JAN2026.md) for complete specifications.

**Summary of upcoming features:**

1. **Branding Page with Table Templates**
   - Centralized branding management page
   - Table templates following sales/expenses patterns
   - Options: Branding assets, product catalog, or marketing materials

2. **Payment Methods Standardization**
   - Fixed to 3 methods: Cash, Orange Money, Card
   - Remove custom payment method creation
   - Update all forms and displays

3. **Production Type Enhancement**
   - Add Patisserie vs Boulangerie distinction
   - Product catalog with predefined items (croissants, baguettes, etc.)
   - Multi-product selection in production logs
   - Track quantities per product

4. **Sales Form Improvements**
   - Prevent duplicate sales for same date (validation)
   - Optional product tracking (which products sold, quantities)
   - Link to Product catalog
   - Clear error messages for duplicates

**Implementation Order:** Payment Methods → Production Types → Sales Improvements → Branding Page

## API Performance Optimization (Pending)

**Status:** Planned - See `.claude/plans/sleepy-puzzling-whale.md` for detailed implementation plan.

**Problem:** Several API endpoints have N+1 query problems causing 8-54 second response times.

| API | Issue | Impact |
|-----|-------|--------|
| `GET /api/customers` | N+1: fetches debts per customer | 9-11s response |
| `POST /api/sales` | N+1: validates debts/products individually | 54s response |
| `GET /api/sales` | O(n²) JS aggregation | 8s response |
| `GET /api/products` | No pagination | 6-8s response |

**Planned Fixes:**

1. **Customers API:** Replace `Promise.all` + individual queries with `prisma.debt.groupBy()` aggregation
2. **Sales POST:** Batch validate all customers/products with `findMany({ where: { id: { in: [...] }}})`
3. **Sales GET:** Use `Map` for O(n) aggregation instead of `.find()` in reduce
4. **All list APIs:** Add cursor-based pagination via `lib/pagination.ts`
5. **Database:** Add `@@index([customerId, status])` to Debt model

**Key Patterns for Optimization:**

```typescript
// BAD: N+1 query pattern
const results = await Promise.all(
  items.map(async (item) => {
    const data = await prisma.model.findUnique({ where: { id: item.id } })
    return { ...item, data }
  })
)

// GOOD: Batch query pattern
const allData = await prisma.model.findMany({
  where: { id: { in: items.map(i => i.id) } }
})
const dataMap = new Map(allData.map(d => [d.id, d]))
const results = items.map(item => ({ ...item, data: dataMap.get(item.id) }))

// GOOD: Use groupBy for aggregations
const aggregations = await prisma.debt.groupBy({
  by: ['customerId'],
  where: { status: { in: ['Outstanding', 'PartiallyPaid'] } },
  _sum: { remainingAmount: true },
  _count: true
})
```

## Skill & Agent Usage Guidelines

Use these skills and agents automatically based on the task type. Do NOT wait for the user to request them.

### Skills (invoke with /command or Skill tool)

| Trigger | Skill | Use When |
|---------|-------|----------|
| Creating API endpoints | `/api-route [path] [methods]` | User asks to add/create API route, endpoint, or backend functionality |
| Creating UI components | `/component [name] [type]` | User asks to add modal, table, card, form, or chart component |
| Adding text/labels | `/i18n [key] [en] [fr]` | Any new user-facing text needs translation keys |
| Before committing | `/review staged` | Review code before git commit for security, patterns, i18n |
| UI design work | `/frontend-design` | Complex UI implementation requiring design quality |
| End of session | `/summary` | User says "wrap up", "end session", or significant work completed |
| Feature requirements | `/po-requirements [feature]` | Before implementing a feature, look up documented requirements |
| Implementation gaps | `/po-gaps` | Check what's implemented vs documented at session start |

### Sub-agents (via Task tool)

| Agent | Use When |
|-------|----------|
| `Explore` | Searching codebase, understanding patterns, answering "where is X?" or "how does Y work?" |
| `Plan` | Complex features requiring architectural decisions |
| `haiku` model | Simple edits, formatting, straightforward tasks (cost-efficient) |

### Automatic Triggers

**MUST use these skills automatically:**

1. **New API route requested** → `/api-route` first, then customize
2. **New component requested** → `/component` first, then customize
3. **New user-facing text** → `/i18n` to add both EN and FR translations
4. **Before commit** → `/review staged` to catch issues
5. **Session ending** → `/summary` to create handoff
6. **Codebase questions** → Use `Explore` agent instead of manual Grep/Glob

### Token Optimization

- Start sessions with resume prompt from `/summary` (saves re-exploration)
- Use `/po-requirements` instead of reading full docs
- Use `Explore` agent for multi-file searches
- Request `model: haiku` for simple tasks when appropriate
