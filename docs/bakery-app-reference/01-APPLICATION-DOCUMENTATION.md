# O'Takos Restaurant Dashboard - Complete Application Documentation

> **Purpose**: This document provides comprehensive technical documentation of the O'Takos Restaurant Dashboard application to serve as a reference for building similar applications.

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Features & Pages](#6-features--pages)
7. [API Endpoints](#7-api-endpoints)
8. [Internationalization](#8-internationalization)
9. [Design System](#9-design-system)
10. [PWA & Mobile Support](#10-pwa--mobile-support)
11. [Key Patterns & Utilities](#11-key-patterns--utilities)

---

## 1. Application Overview

### What It Does

O'Takos Restaurant Dashboard is a **full-stack financial management application** for restaurant operations. It enables:

- **Daily Sales Tracking**: Record and manage daily sales with payment method breakdown
- **Expense Management**: Submit, approve, and track business expenses by category
- **Cash Flow Management**: Track cash deposits to bank, manage payment method balances
- **Financial Analytics**: Visualize revenue, expenses, profit margins, and cash runway
- **Multi-Role Access**: Manager and Editor roles with different permissions
- **Multi-Currency Support**: GNF (Guinean Franc) with EUR display

### Core Workflows

1. **Sales Recording**
   - Editors submit daily sales (manual entry)
   - Managers approve/reject submissions
   - POS integration available (Loyverse)
   - Tracks: cash, Orange Money, card, Akiba payments

2. **Expense Management**
   - Editors submit expenses with receipts
   - Managers approve with transaction references
   - Categories linked to expense groups for dashboard grouping
   - Supplier tracking for vendor management

3. **Cash Deposit Workflow**
   - Auto-created from daily cash sales
   - Manager confirms physical bank deposit
   - Updates running balances per payment method

4. **Dashboard Analytics**
   - KPIs: balance, revenue, expenses, profit margin
   - Charts: revenue trends, expense breakdown, supplier analysis
   - Waterfall chart for cash flow visualization
   - Toggle views for pending vs deposited amounts

### Business Context

- **Location**: Restaurant in Guinea (French-speaking Africa)
- **Owner Location**: Atlanta, USA (remote management)
- **Currency**: GNF (Guinean Franc) primary, EUR for reference
- **Languages**: French (default), English

---

## 2. Tech Stack

### Core Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.0.10 | Full-stack React framework with App Router |
| React | 19.2.0 | UI library with server/client components |
| TypeScript | 5.9.3 | Type-safe development |
| Node.js | 18+ | JavaScript runtime |

### Database & ORM
| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | - | Production database |
| Prisma | 5.22.0 | ORM with schema migrations |

### Authentication
| Technology | Version | Purpose |
|-----------|---------|---------|
| NextAuth.js | 4.24.13 | OAuth authentication |
| JWT | - | Session strategy |

### Frontend UI
| Technology | Version | Purpose |
|-----------|---------|---------|
| Tailwind CSS | 3.4.18 | Utility-first styling |
| Lucide React | 0.555.0 | Icon library |
| Recharts | 3.5.1 | Data visualization |

### Additional Libraries
| Technology | Version | Purpose |
|-----------|---------|---------|
| date-fns | 4.1.0 | Date manipulation |
| xlsx | 0.18.5 | Excel export |
| next-pwa | 5.6.0 | Progressive Web App |

### Development
| Technology | Version | Purpose |
|-----------|---------|---------|
| Playwright | 1.57.0 | E2E testing |
| tsx | 4.21.0 | TypeScript execution |

---

## 3. Project Structure

```
restaurant-app-dashboard/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home/redirect
│   ├── layout.tsx               # Root layout with providers
│   ├── globals.css              # Global styles
│   ├── login/page.tsx           # Authentication page
│   ├── dashboard/page.tsx       # Manager dashboard
│   ├── editor/page.tsx          # Editor submission page
│   ├── sales/page.tsx           # Sales management
│   ├── expenses/page.tsx        # Expense management
│   ├── bank/page.tsx            # Cash deposits & balances
│   ├── admin/page.tsx           # Admin settings panel
│   ├── staff/page.tsx           # Employee management
│   ├── profile/page.tsx         # User profile
│   ├── settings/page.tsx        # User role management
│   └── api/                     # REST API routes (40+ endpoints)
│       ├── auth/[...nextauth]/  # NextAuth handler
│       ├── sales/               # Sales CRUD
│       ├── expenses/            # Expense CRUD + approvals
│       ├── bank/                # Cash deposits
│       ├── dashboard/           # Analytics endpoints
│       ├── daily-summary/       # Aggregated metrics
│       ├── categories/          # Category management
│       ├── expense-groups/      # Expense grouping
│       ├── suppliers/           # Supplier management
│       ├── employees/           # Employee management
│       ├── inventory/           # Inventory tracking
│       ├── users/               # User management
│       └── restaurant-info/     # Configuration
│
├── components/                   # React components
│   ├── SessionProvider.tsx      # NextAuth wrapper
│   ├── LocaleProvider.tsx       # i18n context
│   ├── ThemeProvider.tsx        # Dark/light mode
│   ├── DashboardHeader.tsx      # Main navigation
│   ├── MobileNavigation.tsx     # Mobile sidebar
│   ├── Add*Modal.tsx            # Form modals
│   ├── charts/                  # Chart components
│   └── admin/                   # Admin panels
│
├── hooks/                        # Custom React hooks
│   ├── useCurrencyFormatter.ts
│   ├── useDebounce.ts
│   ├── useIsMobile.ts
│   └── usePermissions.ts
│
├── lib/                         # Utilities
│   ├── prisma.ts               # Database client
│   ├── roles.ts                # Permission system
│   ├── authHelpers.ts          # Auth utilities
│   ├── currency-formatter.ts   # Currency formatting
│   ├── dateUtils.ts            # Date utilities
│   ├── exportUtils.ts          # Excel export
│   └── loyverse.ts             # POS integration
│
├── config/                      # Configuration
│   └── routes.ts               # Role-based routes
│
├── prisma/                      # Database
│   └── schema.prisma           # Schema definition
│
├── public/                      # Static assets
│   ├── locales/                # Translation files
│   │   ├── en.json
│   │   └── fr.json
│   ├── manifest.json           # PWA manifest
│   └── static/images/          # Images
│
└── config files
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js          # PWA setup
    ├── tailwind.config.ts      # Theme
    └── middleware.ts           # Route protection
```

---

## 4. Database Schema

### Core Models

#### User
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  image     String?
  role      UserRole @default(Editor)
  phone     String?
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  Editor
  Manager
}
```

#### RestaurantInfo (Singleton Configuration)
```prisma
model RestaurantInfo {
  id                      String    @id @default("singleton")
  name                    String    @default("O'TAKOS")
  openingDate             DateTime?
  initialCapital          Float     @default(0)
  initialCashBalance      Float     @default(0)
  initialOrangeBalance    Float     @default(0)
  initialCardBalance      Float     @default(0)
  initialAkibaBalance     Float     @default(0)
  initialCashExpenses     Float     @default(0)
  initialOrangeExpenses   Float     @default(0)
  initialCardExpenses     Float     @default(0)
  initialAkibaExpenses    Float     @default(0)
  contactPhone            String?
  contactEmail            String?
  managerName             String?
  currency                String    @default("GNF")
  trackingStartDate       DateTime?
}
```

#### Sale
```prisma
model Sale {
  id                 String           @id @default(uuid())
  date               DateTime         @unique
  totalGNF           Float
  totalEUR           Float
  cashGNF            Float            @default(0)
  orangeMoneyGNF     Float            @default(0)
  cardGNF            Float            @default(0)
  akibaGNF           Float            @default(0)
  source             String           @default("manual")  // "manual" | "loyverse"
  itemsCount         Int?
  customersCount     Int?
  receiptUrl         String?
  openingTime        String?
  closingTime        String?
  comments           String?
  status             SubmissionStatus @default(Pending)
  submittedBy        String?
  submittedByName    String?
  lastModifiedBy     String?
  lastModifiedByName String?
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  cashDeposit        CashDeposit?
}

enum SubmissionStatus {
  Pending
  Approved
  Rejected
}
```

#### Expense
```prisma
model Expense {
  id                 String           @id @default(uuid())
  date               DateTime
  category           String
  amountGNF          Float
  amountEUR          Float
  paymentMethod      String           // Cash, Orange Money, Credit Card, Akiba Mobile
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
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
}
```

#### CashDeposit
```prisma
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
}

enum CashDepositStatus {
  Pending
  Deposited
}
```

#### DailySummary (Aggregated Metrics)
```prisma
model DailySummary {
  id                        String   @id @default(uuid())
  date                      DateTime @unique

  // Daily sales by payment method (deposited only)
  dailyCashSales            Float    @default(0)
  dailyOrangeSales          Float    @default(0)
  dailyCardSales            Float    @default(0)
  dailyAkibaSales           Float    @default(0)

  // Daily expenses by payment method (approved only)
  dailyCashExpenses         Float    @default(0)
  dailyOrangeExpenses       Float    @default(0)
  dailyCardExpenses         Float    @default(0)
  dailyAkibaExpenses        Float    @default(0)

  // Running cumulative balances
  cumulativeCashBalance     Float    @default(0)
  cumulativeOrangeBalance   Float    @default(0)
  cumulativeCardBalance     Float    @default(0)
  cumulativeAkibaBalance    Float    @default(0)

  // Undeposited/pending variations
  undepositedCashVariation  Float    @default(0)
  pendingExpenseVariation   Float    @default(0)

  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
}
```

#### Category
```prisma
model Category {
  id             String             @id @default(uuid())
  name           String             @unique
  color          String?
  expenseGroupId String?
  expenseGroup   ExpenseGroup?      @relation(fields: [expenseGroupId], references: [id])
  suppliers      CategorySupplier[]
  isActive       Boolean            @default(true)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}
```

#### ExpenseGroup
```prisma
model ExpenseGroup {
  id         String     @id @default(uuid())
  key        String     @unique
  label      String
  icon       String     // Lucide icon name
  color      String
  sortOrder  Int        @default(0)
  isActive   Boolean    @default(true)
  categories Category[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}
```

#### Supplier
```prisma
model Supplier {
  id            String             @id @default(uuid())
  name          String             @unique
  phone         String?
  email         String?
  address       String?
  paymentTerms  String?
  isActive      Boolean            @default(true)
  expenses      Expense[]
  categories    CategorySupplier[]
  inventoryItems InventoryItem[]
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
}
```

#### InventoryItem
```prisma
model InventoryItem {
  id           String    @id @default(uuid())
  name         String
  category     String
  unit         String    // kg, L, pieces, etc.
  currentStock Float     @default(0)
  minStock     Float     @default(0)
  unitCostGNF  Float     @default(0)
  supplierId   String?
  supplier     Supplier? @relation(fields: [supplierId], references: [id])
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

#### Employee
```prisma
model Employee {
  id            String   @id @default(uuid())
  name          String
  role          String
  phone         String?
  email         String?
  hireDate      DateTime?
  monthlySalary Float    @default(0)
  status        String   @default("Active")  // Active, Inactive
  photoUrl      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Database Indexes
```prisma
@@index([date])
@@index([status])
@@index([submittedBy])
@@index([category])
@@index([supplierId])
```

---

## 5. Authentication & Authorization

### Authentication Method

- **Provider**: NextAuth.js with Google OAuth
- **Session Strategy**: JWT
- **Session Max Age**: 3 hours
- **Email Whitelist**: ALLOWED_EMAILS environment variable

### Authentication Flow

```
1. User clicks "Continue with Google"
2. Google OAuth callback
3. Email whitelist check (ALLOWED_EMAILS)
4. User created in database if new (default: Editor role)
5. JWT session created
6. Redirect based on role:
   - Manager → /dashboard
   - Editor → /editor
```

### Role System

#### Manager
- Full system access
- Can approve/reject submissions
- Can edit approved items
- Can manage users, settings, admin panel
- **Routes**: /dashboard, /sales, /expenses, /bank, /admin, /settings, /staff, /profile

#### Editor
- Limited submission role
- Can submit sales & expenses
- Can only view own pending submissions
- **Routes**: /editor, /profile

### Permission Helpers

```typescript
// lib/roles.ts
export function isManagerRole(role: UserRole): boolean {
  return role === 'Manager'
}

export function isEditorRole(role: UserRole): boolean {
  return role === 'Editor'
}

export function canAccessSettings(role: UserRole): boolean {
  return isManagerRole(role)
}

export function canApprove(role: UserRole): boolean {
  return isManagerRole(role)
}

export function canEditApproved(role: UserRole): boolean {
  return isManagerRole(role)
}
```

### Middleware Protection

```typescript
// middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sales/:path*",
    "/expenses/:path*",
    "/bank/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/staff/:path*",
    "/editor/:path*",
    "/profile/:path*",
  ]
}
```

---

## 6. Features & Pages

### Dashboard (`/dashboard`)
**Manager Only**

- **KPIs**: Current balance, total revenue, total expenses, profit margin
- **Metrics**: Daily burn rate, cash runway, expense ratio
- **Charts**:
  - Revenue trend (line/area chart with time period filter)
  - Expense by category (pie chart)
  - Food by supplier (bar chart)
  - Waterfall chart (cash flow)
  - Payment method balances (multi-line)
- **Toggles**: Show undeposited revenue, show pending expenses
- **Widgets**: Pending approvals count

### Sales (`/sales`)
**Managers**: Full access | **Editors**: Submit only

- **Form Fields**: Date, amounts (total, cash, Orange Money, card, Akiba), items count, customers, store hours, comments
- **Features**:
  - Manual entry or POS sync (Loyverse)
  - Approval workflow
  - Receipt upload
  - Filtering by date, amount, source, deposit status
  - Pagination & Excel export

### Expenses (`/expenses`)
**Managers**: Full access | **Editors**: Submit only

- **Form Fields**: Date, category, supplier, amount, payment method, description, receipt
- **Features**:
  - 40+ expense categories
  - Supplier selection with custom option
  - Approval workflow with transaction reference
  - Filtering by category, supplier, payment method, status, search
  - Summary statistics
  - Pagination & Excel export

### Bank (`/bank`)
**Manager Only**

- **Cash Deposits**: Auto-created from daily cash sales
- **Confirmation Flow**: Manager confirms physical bank deposit
- **Balance Tracking**: By payment method (Cash, Orange Money, Card, Akiba)
- **Charts**: Balance trends, daily breakdown

### Editor (`/editor`)
**Editor Only**

- Quick action buttons (Submit Expense, Submit Sale)
- Recent submissions list (last 5)
- Status tracking (Pending/Approved/Rejected)
- How It Works guide

### Admin (`/admin`)
**Manager Only**

- **Initial Setup**: Restaurant name, opening date, initial balances
- **Expense Groups**: Create/edit groups with icons and colors
- **Categories**: Manage expense categories, link to suppliers
- **Suppliers**: Supplier CRUD with contact info

### Settings (`/settings`)
**Manager Only**

- View all users
- Change user roles (Editor ↔ Manager)
- Member since dates

### Profile (`/profile`)
**All Users**

- Edit name, phone, address
- View email (read-only)

---

## 7. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List sales (with filters) |
| POST | `/api/sales` | Create sale |
| GET | `/api/sales/[id]` | Get single sale |
| PUT | `/api/sales/[id]` | Update sale |
| DELETE | `/api/sales/[id]` | Delete sale |
| GET | `/api/sales/summary` | Sales statistics |
| POST | `/api/sales/sync` | Loyverse sync |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (with filters) |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/[id]` | Get single expense |
| PUT | `/api/expenses/[id]` | Update expense |
| DELETE | `/api/expenses/[id]` | Delete expense |
| POST | `/api/expenses/[id]/approve` | Approve/reject |
| GET | `/api/expenses/pending-count` | Count pending |

### Cash Deposits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bank/cash-deposits` | List deposits |
| POST | `/api/bank/cash-deposits` | Create deposit |
| PUT | `/api/bank/cash-deposits/[id]` | Update (confirm) |
| GET | `/api/bank/pending-count` | Count pending |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/metrics` | Dashboard metrics |
| GET | `/api/dashboard/stats` | Weekly/monthly stats |
| GET | `/api/dashboard/food-by-supplier` | Supplier breakdown |

### Daily Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-summary/chart` | Chart data |
| POST | `/api/daily-summary/regenerate` | Regenerate all |

### Categories, Expense Groups, Suppliers
Standard CRUD endpoints for each resource.

### Common Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `dateFrom`, `dateTo` - Date range filter
- `status` - Pending/Approved/Rejected
- `search` - Full-text search

---

## 8. Internationalization

### Setup

- **Languages**: English (en), French (fr)
- **Default**: French
- **Implementation**: Custom React Context with localStorage persistence

### Translation Files

```
public/locales/
├── en.json   # 753+ keys
└── fr.json   # 733+ keys
```

### Key Categories

```json
{
  "common": { "appName": "O'TAKOS", "overview": "Overview", ... },
  "dashboard": { "totalRevenue": "Total Revenue", ... },
  "sales": { "addSale": "Add Sale", ... },
  "expenses": { "addExpense": "Add Expense", ... },
  "bank": { "cashDeposits": "Cash Deposits", ... },
  "admin": { "title": "Administration", ... },
  "errors": { "generic": "An error occurred", ... },
  "notifications": { "success": "Success!", ... }
}
```

### Usage

```typescript
const { t, locale, setLocale } = useLocale()

// Simple translation
t('common.appName')  // "O'TAKOS"

// With fallback
t('some.key', 'Default text')

// Change language
setLocale('en')  // Persisted to localStorage
```

---

## 9. Design System

### Brand Colors

```typescript
// tailwind.config.ts
otakos: {
  gold: {
    50: '#fdfaf3',   // Lightest
    100: '#faf5e6',
    200: '#f3e6c0',
    300: '#ecd799',
    400: '#e5c873',
    500: '#D4AF37', // PRIMARY
    600: '#c09a2f',
    700: '#a08527',
    800: '#80701f',
    900: '#605b17',
  },
  black: '#000000',
  white: '#FFFFFF',
  dark: {
    50: '#f7f7f7',
    // ... full scale
    950: '#0a0a0a',
  }
}
```

### Typography

- **Sans-serif**: Inter (body text)
- **Display**: Playfair Display (headings)

### Dark Mode

- Class-based: `dark` class on `<html>`
- Default: Dark theme
- Toggle via ThemeProvider

### Key Patterns

```tsx
// Card
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

// Primary button
<button className="px-4 py-2 bg-otakos-gold-600 text-white rounded-lg hover:bg-otakos-gold-700">

// Input
<input className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-otakos-gold-500 dark:bg-gray-700 dark:text-white">

// Status badge
<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
```

---

## 10. PWA & Mobile Support

### PWA Configuration

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})
```

### Manifest

```json
{
  "name": "O'TAKOS Dashboard",
  "short_name": "O'TAKOS",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#D4AF37",
  "background_color": "#0a0a0a"
}
```

### Mobile Responsive

- Mobile-first approach
- Breakpoint: 1024px for desktop/mobile switch
- Touch targets: Minimum 44x44px
- Safe areas for iOS notch/home indicator

---

## 11. Key Patterns & Utilities

### Currency Formatting

```typescript
// lib/currency-formatter.ts
export function formatCurrency(amount: number, currency = 'GNF'): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}
```

### Date Utilities

```typescript
// lib/dateUtils.ts
export function formatDate(date: Date, locale = 'fr'): string {
  return format(date, 'PPP', { locale: locale === 'fr' ? fr : enUS })
}
```

### Export to Excel

```typescript
// lib/exportUtils.ts
export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
```

### Approval Workflow Pattern

```typescript
// POST /api/expenses/[id]/approve
const { action, transactionRef } = body  // action: 'approve' | 'reject'

await prisma.expense.update({
  where: { id },
  data: {
    status: action === 'approve' ? 'Approved' : 'Rejected',
    transactionRef,
    approvedBy: session.user.id,
    approvedByName: session.user.name,
    approvedAt: new Date(),
  },
})
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Pages | 10+ |
| API Endpoints | 40+ |
| Database Models | 17 |
| Reusable Components | 50+ |
| Languages | 2 |
| Translation Keys | 1500+ |

---

**This documentation provides the complete technical reference for building similar applications.**
