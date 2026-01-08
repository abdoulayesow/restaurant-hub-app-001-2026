# Bakery Hub - Technical Specification

> **Status**: Draft
> **Last Updated**: 2026-01-05
> **Based On**: O'Takos Restaurant Dashboard Reference

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [API Endpoints](#3-api-endpoints)
4. [Component Hierarchy](#4-component-hierarchy)
5. [State Management](#5-state-management)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Internationalization](#7-internationalization)
8. [PWA & Mobile](#8-pwa--mobile)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Owner     │  │   Manager   │  │    Baker    │  │    Sales    │        │
│  │  (Atlanta)  │  │  (Conakry)  │  │  (Conakry)  │  │  (Conakry)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                          ┌───────┴───────┐                                  │
│                          │  PWA (React)  │                                  │
│                          │  Mobile-First │                                  │
│                          └───────┬───────┘                                  │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │ HTTPS
┌──────────────────────────────────┼──────────────────────────────────────────┐
│                              SERVER LAYER                                    │
├──────────────────────────────────┼──────────────────────────────────────────┤
│                          ┌───────┴───────┐                                  │
│                          │   Next.js     │                                  │
│                          │  App Router   │                                  │
│                          └───────┬───────┘                                  │
│                                  │                                          │
│         ┌────────────────────────┼────────────────────────┐                 │
│         │                        │                        │                 │
│  ┌──────┴──────┐         ┌───────┴───────┐        ┌──────┴──────┐          │
│  │  API Routes │         │   NextAuth    │        │   Prisma    │          │
│  │  /api/*     │         │    (Auth)     │        │    (ORM)    │          │
│  └─────────────┘         └───────────────┘        └──────┬──────┘          │
└──────────────────────────────────────────────────────────┼──────────────────┘
                                                           │
┌──────────────────────────────────────────────────────────┼──────────────────┐
│                              DATA LAYER                  │                   │
├──────────────────────────────────────────────────────────┼──────────────────┤
│                                                  ┌───────┴───────┐          │
│                                                  │  PostgreSQL   │          │
│                                                  │   (Vercel)    │          │
│                                                  └───────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 16+ | React framework with App Router |
| **Frontend** | React | 19+ | UI components |
| **Frontend** | TypeScript | 5.9+ | Type safety |
| **Frontend** | Tailwind CSS | 3.4+ | Styling |
| **Frontend** | Recharts | 3.5+ | Data visualization |
| **Frontend** | Lucide React | 0.555+ | Icons |
| **Backend** | Next.js API Routes | - | REST API |
| **Backend** | NextAuth.js | 4.24+ | Authentication |
| **Backend** | Prisma | 5.22+ | ORM |
| **Database** | PostgreSQL | 15+ | Data storage |
| **Deployment** | Vercel | - | Hosting & serverless |
| **PWA** | next-pwa | 5.6+ | Progressive Web App |

---

## 2. Database Schema

### Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// AUTHENTICATION & USERS
// ============================================================================

model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String?
  image     String?
  role      UserRole  @default(Editor)
  phone     String?
  address   String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  accounts  Account[]
  sessions  Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum UserRole {
  Editor   // On-site staff (Manager, Baker, Sales)
  Manager  // Owner (remote)
}

// ============================================================================
// BAKERY CONFIGURATION
// ============================================================================

model BakeryInfo {
  id                    String    @id @default("singleton")
  name                  String    @default("Bakery Hub")
  openingDate           DateTime?
  initialCapital        Float     @default(0)
  initialCashBalance    Float     @default(0)
  initialOrangeBalance  Float     @default(0)
  initialCardBalance    Float     @default(0)
  contactPhone          String?
  contactEmail          String?
  managerName           String?
  currency              String    @default("GNF")
  trackingStartDate     DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

model InventoryItem {
  id             String          @id @default(uuid())
  name           String
  nameFr         String?         // French name
  category       String          // Dry goods, Dairy, Packaging, etc.
  unit           String          // kg, L, pieces, dozen
  currentStock   Float           @default(0)
  minStock       Float           @default(0)
  reorderPoint   Float           @default(0)
  unitCostGNF    Float           @default(0)
  supplierId     String?
  supplier       Supplier?       @relation(fields: [supplierId], references: [id])
  expiryDays     Int?            // Days until expiry for perishables
  isActive       Boolean         @default(true)
  stockMovements StockMovement[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  @@index([category])
  @@index([supplierId])
  @@index([isActive])
}

model StockMovement {
  id              String        @id @default(uuid())
  itemId          String
  item            InventoryItem @relation(fields: [itemId], references: [id])
  type            MovementType
  quantity        Float         // Positive for in, negative for out
  unitCost        Float?
  reason          String?
  productionLogId String?
  productionLog   ProductionLog? @relation(fields: [productionLogId], references: [id])
  expenseId       String?
  expense         Expense?      @relation(fields: [expenseId], references: [id])
  createdBy       String
  createdByName   String?
  createdAt       DateTime      @default(now())

  @@index([itemId])
  @@index([type])
  @@index([createdAt])
}

enum MovementType {
  Purchase    // Buying from supplier
  Usage       // Used in production
  Waste       // Spoilage, damage
  Adjustment  // Manual correction
}

// ============================================================================
// PRODUCTION TRACKING
// ============================================================================

model ProductionLog {
  id             String          @id @default(uuid())
  date           DateTime
  productName    String
  productNameFr  String?
  quantity       Int
  ingredients    Json            // [{ itemId, itemName, quantity, unit }]
  notes          String?
  status         SubmissionStatus @default(Pending)
  createdBy      String
  createdByName  String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  stockMovements StockMovement[]

  @@index([date])
  @@index([status])
}

// ============================================================================
// SALES TRACKING
// ============================================================================

model Sale {
  id                 String           @id @default(uuid())
  date               DateTime         @unique
  totalGNF           Float
  totalEUR           Float            @default(0)
  cashGNF            Float            @default(0)
  orangeMoneyGNF     Float            @default(0)
  cardGNF            Float            @default(0)
  itemsCount         Int?
  customersCount     Int?
  receiptUrl         String?
  openingTime        String?
  closingTime        String?
  comments           String?
  status             SubmissionStatus @default(Pending)
  submittedBy        String?
  submittedByName    String?
  approvedBy         String?
  approvedByName     String?
  approvedAt         DateTime?
  lastModifiedBy     String?
  lastModifiedByName String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  cashDeposit        CashDeposit?

  @@index([date])
  @@index([status])
}

enum SubmissionStatus {
  Pending
  Approved
  Rejected
}

// ============================================================================
// EXPENSE MANAGEMENT
// ============================================================================

model Expense {
  id                 String           @id @default(uuid())
  date               DateTime
  categoryId         String?
  category           Category?        @relation(fields: [categoryId], references: [id])
  categoryName       String           // Denormalized for display
  amountGNF          Float
  amountEUR          Float            @default(0)
  paymentMethod      PaymentMethod
  description        String?
  receiptUrl         String?
  comments           String?
  transactionRef     String?
  status             SubmissionStatus @default(Pending)
  submittedBy        String?
  submittedByName    String?
  approvedBy         String?
  approvedByName     String?
  approvedAt         DateTime?
  lastModifiedBy     String?
  lastModifiedByName String?
  lastModifiedAt     DateTime?
  supplierId         String?
  supplier           Supplier?        @relation(fields: [supplierId], references: [id])
  isInventoryPurchase Boolean         @default(false)
  stockMovements     StockMovement[]
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  @@index([date])
  @@index([status])
  @@index([categoryId])
  @@index([supplierId])
}

enum PaymentMethod {
  Cash
  OrangeMoney
  Card
}

// ============================================================================
// CATEGORIES & SUPPLIERS
// ============================================================================

model Category {
  id             String             @id @default(uuid())
  name           String             @unique
  nameFr         String?
  color          String?
  expenseGroupId String?
  expenseGroup   ExpenseGroup?      @relation(fields: [expenseGroupId], references: [id])
  suppliers      CategorySupplier[]
  expenses       Expense[]
  isActive       Boolean            @default(true)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model ExpenseGroup {
  id         String     @id @default(uuid())
  key        String     @unique
  label      String
  labelFr    String?
  icon       String     // Lucide icon name
  color      String
  sortOrder  Int        @default(0)
  isActive   Boolean    @default(true)
  categories Category[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model Supplier {
  id             String             @id @default(uuid())
  name           String             @unique
  phone          String?
  email          String?
  address        String?
  paymentTerms   String?
  isActive       Boolean            @default(true)
  expenses       Expense[]
  categories     CategorySupplier[]
  inventoryItems InventoryItem[]
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model CategorySupplier {
  id         String   @id @default(uuid())
  categoryId String
  supplierId String
  category   Category @relation(fields: [categoryId], references: [id])
  supplier   Supplier @relation(fields: [supplierId], references: [id])

  @@unique([categoryId, supplierId])
}

// ============================================================================
// CASH DEPOSITS
// ============================================================================

model CashDeposit {
  id              String            @id @default(uuid())
  date            DateTime
  amount          Float
  status          CashDepositStatus @default(Pending)
  bankRef         String?
  receiptUrl      String?
  comments        String?
  depositedBy     String?
  depositedByName String?
  depositedAt     DateTime?
  saleId          String?           @unique
  sale            Sale?             @relation(fields: [saleId], references: [id])
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([date])
  @@index([status])
}

enum CashDepositStatus {
  Pending
  Deposited
}

// ============================================================================
// DAILY SUMMARY (Aggregated Metrics)
// ============================================================================

model DailySummary {
  id                        String   @id @default(uuid())
  date                      DateTime @unique

  // Daily sales by payment method
  dailyCashSales            Float    @default(0)
  dailyOrangeSales          Float    @default(0)
  dailyCardSales            Float    @default(0)

  // Daily expenses by payment method
  dailyCashExpenses         Float    @default(0)
  dailyOrangeExpenses       Float    @default(0)
  dailyCardExpenses         Float    @default(0)

  // Running cumulative balances
  cumulativeCashBalance     Float    @default(0)
  cumulativeOrangeBalance   Float    @default(0)
  cumulativeCardBalance     Float    @default(0)

  // Inventory metrics
  lowStockItemsCount        Int      @default(0)
  criticalStockItemsCount   Int      @default(0)
  totalInventoryValueGNF    Float    @default(0)

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  @@index([date])
}
```

### Inventory Categories (Seed Data)

```typescript
const inventoryCategories = [
  { key: 'dry_goods', label: 'Dry Goods', labelFr: 'Produits secs' },
  { key: 'dairy', label: 'Dairy', labelFr: 'Produits laitiers' },
  { key: 'flavorings', label: 'Flavorings', labelFr: 'Arômes' },
  { key: 'packaging', label: 'Packaging', labelFr: 'Emballages' },
  { key: 'utilities', label: 'Utilities', labelFr: 'Fournitures' },
]

const measurementUnits = [
  { key: 'kg', label: 'Kilograms', labelFr: 'Kilogrammes' },
  { key: 'g', label: 'Grams', labelFr: 'Grammes' },
  { key: 'L', label: 'Liters', labelFr: 'Litres' },
  { key: 'mL', label: 'Milliliters', labelFr: 'Millilitres' },
  { key: 'pieces', label: 'Pieces', labelFr: 'Pièces' },
  { key: 'dozen', label: 'Dozen', labelFr: 'Douzaines' },
  { key: 'bags', label: 'Bags', labelFr: 'Sacs' },
  { key: 'boxes', label: 'Boxes', labelFr: 'Boîtes' },
]
```

---

## 3. API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler | Public |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Manager |
| GET | `/api/users/[id]` | Get user details | Manager |
| PUT | `/api/users/[id]` | Update user (role, profile) | Manager |
| GET | `/api/users/me` | Get current user | Any |
| PUT | `/api/users/me` | Update own profile | Any |

### Inventory

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/inventory` | List inventory items | Any |
| POST | `/api/inventory` | Create inventory item | Manager |
| GET | `/api/inventory/[id]` | Get item details | Any |
| PUT | `/api/inventory/[id]` | Update item | Manager |
| DELETE | `/api/inventory/[id]` | Soft delete item | Manager |
| GET | `/api/inventory/low-stock` | Items below minStock | Any |
| GET | `/api/inventory/critical` | Items near zero | Any |
| POST | `/api/inventory/[id]/adjust` | Stock adjustment | Editor |
| GET | `/api/inventory/categories` | List categories | Any |
| GET | `/api/inventory/summary` | Inventory statistics | Any |

### Stock Movements

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stock-movements` | List movements | Any |
| POST | `/api/stock-movements` | Create movement | Editor |
| GET | `/api/stock-movements/[id]` | Get movement | Any |
| GET | `/api/stock-movements/by-item/[itemId]` | Item history | Any |

### Production

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/production` | List production logs | Any |
| POST | `/api/production` | Create production log | Editor |
| GET | `/api/production/[id]` | Get production details | Any |
| PUT | `/api/production/[id]` | Update production | Editor |
| DELETE | `/api/production/[id]` | Delete production | Manager |
| GET | `/api/production/daily/[date]` | Get by date | Any |
| GET | `/api/production/summary` | Production statistics | Any |

### Sales

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/sales` | List sales | Any |
| POST | `/api/sales` | Create sale | Editor |
| GET | `/api/sales/[id]` | Get sale details | Any |
| PUT | `/api/sales/[id]` | Update sale | Editor/Manager |
| DELETE | `/api/sales/[id]` | Delete sale | Manager |
| POST | `/api/sales/[id]/approve` | Approve/reject | Manager |
| GET | `/api/sales/summary` | Sales statistics | Any |
| GET | `/api/sales/pending-count` | Count pending | Any |

### Expenses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/expenses` | List expenses | Any |
| POST | `/api/expenses` | Create expense | Editor |
| GET | `/api/expenses/[id]` | Get expense details | Any |
| PUT | `/api/expenses/[id]` | Update expense | Editor/Manager |
| DELETE | `/api/expenses/[id]` | Delete expense | Manager |
| POST | `/api/expenses/[id]/approve` | Approve/reject | Manager |
| GET | `/api/expenses/summary` | Expense statistics | Any |
| GET | `/api/expenses/pending-count` | Count pending | Any |
| GET | `/api/expenses/by-category` | Group by category | Any |

### Categories & Suppliers

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List categories | Any |
| POST | `/api/categories` | Create category | Manager |
| PUT | `/api/categories/[id]` | Update category | Manager |
| DELETE | `/api/categories/[id]` | Delete category | Manager |
| GET | `/api/expense-groups` | List expense groups | Any |
| POST | `/api/expense-groups` | Create group | Manager |
| GET | `/api/suppliers` | List suppliers | Any |
| POST | `/api/suppliers` | Create supplier | Manager |
| PUT | `/api/suppliers/[id]` | Update supplier | Manager |
| DELETE | `/api/suppliers/[id]` | Delete supplier | Manager |

### Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/metrics` | KPI metrics | Any |
| GET | `/api/dashboard/inventory-alerts` | Low stock alerts | Any |
| GET | `/api/dashboard/revenue-trend` | Revenue chart data | Any |
| GET | `/api/dashboard/expense-breakdown` | Expense by category | Any |
| GET | `/api/dashboard/production-summary` | Production stats | Any |

### Bank & Cash Deposits

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bank/cash-deposits` | List deposits | Manager |
| POST | `/api/bank/cash-deposits` | Create deposit | Manager |
| PUT | `/api/bank/cash-deposits/[id]` | Confirm deposit | Manager |
| GET | `/api/bank/balances` | Payment method balances | Manager |

### Bakery Configuration

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/bakery-info` | Get bakery config | Any |
| PUT | `/api/bakery-info` | Update config | Manager |

---

## 4. Component Hierarchy

### Application Structure

```
app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Home redirect
├── globals.css                   # Global styles
│
├── login/
│   └── page.tsx                  # Login page
│
├── dashboard/
│   └── page.tsx                  # Owner dashboard
│
├── editor/
│   └── page.tsx                  # Editor quick actions
│
├── inventory/
│   ├── page.tsx                  # Inventory list
│   └── [id]/
│       └── page.tsx              # Item detail with history
│
├── production/
│   └── page.tsx                  # Production logging
│
├── sales/
│   └── page.tsx                  # Sales management
│
├── expenses/
│   └── page.tsx                  # Expense management
│
├── bank/
│   └── page.tsx                  # Cash deposits (Manager)
│
├── admin/
│   └── page.tsx                  # Admin settings
│
├── settings/
│   └── page.tsx                  # User management
│
├── profile/
│   └── page.tsx                  # User profile
│
└── api/                          # API routes (see above)
```

### Component Library

```
components/
├── providers/
│   ├── SessionProvider.tsx       # NextAuth session
│   ├── LocaleProvider.tsx        # i18n context
│   └── ThemeProvider.tsx         # Dark/light mode
│
├── layout/
│   ├── DashboardHeader.tsx       # Main navigation header
│   ├── MobileNavigation.tsx      # Mobile sidebar/bottom nav
│   ├── PageContainer.tsx         # Standard page wrapper
│   └── Card.tsx                  # Standard card component
│
├── forms/
│   ├── AddInventoryModal.tsx     # Inventory form
│   ├── AddProductionModal.tsx    # Production log form
│   ├── AddSaleModal.tsx          # Sales form
│   ├── AddExpenseModal.tsx       # Expense form
│   ├── StockAdjustmentModal.tsx  # Quick stock adjust
│   └── ApprovalModal.tsx         # Approve/reject dialog
│
├── tables/
│   ├── InventoryTable.tsx        # Inventory list
│   ├── ProductionTable.tsx       # Production logs
│   ├── SalesTable.tsx            # Sales list
│   ├── ExpenseTable.tsx          # Expenses list
│   └── TablePagination.tsx       # Pagination controls
│
├── charts/
│   ├── RevenueTrendChart.tsx     # Line/area chart
│   ├── ExpenseBreakdownChart.tsx # Pie chart
│   ├── InventoryStatusChart.tsx  # Bar chart
│   └── ProductionChart.tsx       # Bar chart
│
├── dashboard/
│   ├── KPICard.tsx               # Metric display card
│   ├── InventoryAlerts.tsx       # Low stock warnings
│   ├── PendingApprovals.tsx      # Pending items count
│   └── QuickActions.tsx          # Editor quick buttons
│
├── inventory/
│   ├── InventoryCard.tsx         # Item card view
│   ├── StockLevelBadge.tsx       # Stock status badge
│   ├── MovementHistory.tsx       # Item movement list
│   └── CategoryFilter.tsx        # Category dropdown
│
├── common/
│   ├── StatusBadge.tsx           # Pending/Approved/Rejected
│   ├── CurrencyDisplay.tsx       # GNF/EUR formatting
│   ├── DatePicker.tsx            # Date selection
│   ├── SearchInput.tsx           # Search box
│   ├── EmptyState.tsx            # No data placeholder
│   ├── LoadingSpinner.tsx        # Loading indicator
│   ├── ConfirmDialog.tsx         # Confirmation modal
│   └── Toast.tsx                 # Notification toast
│
└── admin/
    ├── CategoryManager.tsx       # Category CRUD
    ├── SupplierManager.tsx       # Supplier CRUD
    ├── ExpenseGroupManager.tsx   # Expense groups
    └── BakerySettings.tsx        # Initial config
```

---

## 5. State Management

### Approach: Server Components + Client State

```typescript
// Primary: Server Components (RSC)
// - Data fetching at component level
// - No client-side state for data
// - Use Prisma directly in server components

// Secondary: Client State (React hooks)
// - UI state (modals, filters, selections)
// - Form state (controlled inputs)
// - Optimistic updates
```

### Custom Hooks

```typescript
// hooks/useCurrencyFormatter.ts
export function useCurrencyFormatter() {
  const formatGNF = (amount: number) =>
    new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF' }).format(amount)

  const formatEUR = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  return { formatGNF, formatEUR }
}

// hooks/useLocale.ts
export function useLocale() {
  const [locale, setLocale] = useState<'fr' | 'en'>('fr')
  const t = (key: string, fallback?: string) => translations[locale][key] || fallback || key
  return { locale, setLocale, t }
}

// hooks/usePermissions.ts
export function usePermissions() {
  const { data: session } = useSession()
  const isManager = session?.user?.role === 'Manager'
  const isEditor = session?.user?.role === 'Editor'
  const canApprove = isManager
  const canEditApproved = isManager
  return { isManager, isEditor, canApprove, canEditApproved }
}

// hooks/useIsMobile.ts
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}
```

### Bakery Context

The `BakeryProvider` manages multi-bakery support with automatic color theming.

```typescript
// components/providers/BakeryProvider.tsx
interface BakeryContextType {
  bakeries: Bakery[]           // All accessible bakeries for user
  currentBakery: Bakery | null // Currently selected bakery
  currentPalette: PaletteName  // Color palette for current bakery
  setCurrentBakery: (bakery: Bakery) => void
  loading: boolean
}

// Palette assignment by bakery index (cycles through 4 palettes)
type PaletteName = 'terracotta' | 'warmBrown' | 'burntSienna' | 'gold'
```

**Features:**
- Automatic palette assignment by bakery index
- localStorage persistence for selected bakery
- Toast notification on bakery switch
- Data automatically refreshes when switching bakeries

**Color Palettes:**
| Index | Palette | Primary Color |
|-------|---------|---------------|
| 0 | Terracotta | #C45C26 |
| 1 | Warm Brown | #8B4513 |
| 2 | Burnt Sienna | #A0522D |
| 3 | Classic Gold | #D4AF37 |

**Usage:**
```typescript
const { currentBakery, currentPalette, setCurrentBakery } = useBakery()

// Access color values for dynamic styling
import { colorPalettes } from '@/components/brand/Logo'
const accentColor = colorPalettes[currentPalette].primary
```

---

## 6. Authentication & Authorization

### NextAuth Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS?.split(',') || []

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 3 * 60 * 60, // 3 hours
  },
  callbacks: {
    async signIn({ user }) {
      return ALLOWED_EMAILS.includes(user.email!)
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email! } })
        token.role = dbUser?.role || 'Editor'
        token.id = dbUser?.id
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.id = token.id
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Middleware Protection

```typescript
// middleware.ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/production/:path*',
    '/sales/:path*',
    '/expenses/:path*',
    '/bank/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/editor/:path*',
    '/profile/:path*',
  ],
}
```

### Role-Based Route Access

```typescript
// config/routes.ts
export const routeAccess = {
  '/dashboard': ['Manager'],
  '/editor': ['Editor'],
  '/inventory': ['Manager', 'Editor'],
  '/production': ['Manager', 'Editor'],
  '/sales': ['Manager', 'Editor'],
  '/expenses': ['Manager', 'Editor'],
  '/bank': ['Manager'],
  '/admin': ['Manager'],
  '/settings': ['Manager'],
  '/profile': ['Manager', 'Editor'],
}
```

---

## 7. Internationalization

### Translation Structure

```
public/locales/
├── en.json
└── fr.json
```

### Translation Keys

```json
// public/locales/fr.json (French - Primary)
{
  "common": {
    "appName": "Bakery Hub",
    "dashboard": "Tableau de bord",
    "inventory": "Inventaire",
    "production": "Production",
    "sales": "Ventes",
    "expenses": "Dépenses",
    "settings": "Paramètres",
    "profile": "Profil",
    "logout": "Déconnexion",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "add": "Ajouter",
    "search": "Rechercher",
    "filter": "Filtrer",
    "export": "Exporter",
    "loading": "Chargement...",
    "noData": "Aucune donnée"
  },
  "inventory": {
    "title": "Gestion des stocks",
    "addItem": "Ajouter un article",
    "itemName": "Nom de l'article",
    "category": "Catégorie",
    "currentStock": "Stock actuel",
    "minStock": "Stock minimum",
    "unit": "Unité",
    "unitCost": "Coût unitaire",
    "supplier": "Fournisseur",
    "lowStock": "Stock faible",
    "critical": "Critique",
    "inStock": "En stock",
    "adjust": "Ajuster",
    "movement": "Mouvement",
    "purchase": "Achat",
    "usage": "Utilisation",
    "waste": "Perte"
  },
  "production": {
    "title": "Journal de production",
    "addProduction": "Ajouter une production",
    "productName": "Produit",
    "quantity": "Quantité",
    "ingredients": "Ingrédients utilisés",
    "date": "Date",
    "notes": "Notes"
  },
  "sales": {
    "title": "Ventes",
    "addSale": "Ajouter une vente",
    "totalSales": "Ventes totales",
    "cash": "Espèces",
    "orangeMoney": "Orange Money",
    "card": "Carte",
    "pending": "En attente",
    "approved": "Approuvé",
    "rejected": "Rejeté"
  },
  "expenses": {
    "title": "Dépenses",
    "addExpense": "Ajouter une dépense",
    "amount": "Montant",
    "paymentMethod": "Mode de paiement",
    "receipt": "Reçu",
    "approve": "Approuver",
    "reject": "Rejeter"
  },
  "dashboard": {
    "totalBalance": "Solde total",
    "totalRevenue": "Revenu total",
    "totalExpenses": "Dépenses totales",
    "profitMargin": "Marge bénéficiaire",
    "lowStockAlerts": "Alertes stock faible",
    "pendingApprovals": "Approbations en attente",
    "revenueOverTime": "Revenus dans le temps",
    "expensesByCategory": "Dépenses par catégorie"
  },
  "categories": {
    "dryGoods": "Produits secs",
    "dairy": "Produits laitiers",
    "flavorings": "Arômes",
    "packaging": "Emballages",
    "utilities": "Fournitures"
  },
  "units": {
    "kg": "kg",
    "g": "g",
    "L": "L",
    "mL": "mL",
    "pieces": "pièces",
    "dozen": "douzaines"
  }
}
```

### Locale Provider

```typescript
// components/providers/LocaleProvider.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'fr' | 'en'
type Translations = Record<string, Record<string, string>>

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')
  const [translations, setTranslations] = useState<Translations>({})

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale
    if (saved) setLocaleState(saved)
  }, [])

  useEffect(() => {
    fetch(`/locales/${locale}.json`)
      .then(res => res.json())
      .then(setTranslations)
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.')
    let value: any = translations
    for (const k of keys) {
      value = value?.[k]
    }
    return value || fallback || key
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}
```

---

## 8. PWA & Mobile

### PWA Configuration

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // Next.js config
})
```

### Web App Manifest

```json
// public/manifest.json
{
  "name": "Bakery Hub",
  "short_name": "Bakery Hub",
  "description": "Bakery inventory and management system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#D4AF37",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Mobile Responsive Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */

/* Mobile-first approach */
/* Base styles: mobile */
/* Add complexity with breakpoint prefixes */
```

### Touch-Friendly Guidelines

- Minimum touch target: 44x44px
- Adequate spacing between interactive elements
- Bottom navigation for mobile
- Swipe gestures where appropriate
- Pull-to-refresh on lists

---

## 9. Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Edge Network  │    │   Serverless    │                │
│  │    (Static)     │    │   Functions     │                │
│  │                 │    │   (API Routes)  │                │
│  │  - HTML/CSS/JS  │    │                 │                │
│  │  - Images       │    │  - /api/*       │                │
│  │  - PWA assets   │    │  - Auth         │                │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              │ Vercel        │                              │
│              │ Postgres      │                              │
│              └───────────────┘                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://bakery-hub.vercel.app"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ALLOWED_EMAILS="owner@email.com,manager@email.com"
```

### CI/CD Pipeline

```yaml
# Vercel auto-deploys on push to main
# Preview deployments on PR branches

# Database migrations
# Run manually or via Vercel build command:
# npx prisma migrate deploy
```

---

## 10. Testing Strategy

### Testing Layers

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit Tests | Vitest | Utilities, hooks |
| Component Tests | React Testing Library | UI components |
| Integration Tests | Vitest + MSW | API routes |
| E2E Tests | Playwright | Critical flows |

### Test File Structure

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── currency-formatter.test.ts
│   │   └── date-utils.test.ts
│   └── hooks/
│       └── usePermissions.test.ts
│
├── components/
│   ├── StatusBadge.test.tsx
│   ├── InventoryTable.test.tsx
│   └── KPICard.test.tsx
│
├── api/
│   ├── inventory.test.ts
│   ├── sales.test.ts
│   └── expenses.test.ts
│
└── e2e/
    ├── auth.spec.ts
    ├── inventory-flow.spec.ts
    ├── sales-approval.spec.ts
    └── expense-submission.spec.ts
```

### Critical E2E Test Scenarios

```typescript
// e2e/inventory-flow.spec.ts
test('Manager can add inventory item and see low stock alert', async ({ page }) => {
  // 1. Login as Manager
  // 2. Navigate to Inventory
  // 3. Add new item with minStock = 10, currentStock = 5
  // 4. Verify low stock badge appears
  // 5. Verify dashboard shows alert
})

// e2e/expense-submission.spec.ts
test('Editor submits expense, Manager approves', async ({ page }) => {
  // 1. Login as Editor
  // 2. Submit expense with receipt
  // 3. Verify pending status
  // 4. Logout, login as Manager
  // 5. Approve expense
  // 6. Verify approved status
})
```

### Test Commands

```bash
npm run test          # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run e2e           # Playwright E2E tests
npm run e2e:ui        # Playwright UI mode
```
