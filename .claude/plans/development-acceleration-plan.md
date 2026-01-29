# Bakery Hub Development Acceleration Plan

**Date**: 2026-01-26
**Status**: Draft for Review
**Goal**: Accelerate product release through performance optimization and workflow improvements

---

## Executive Summary

After comprehensive analysis of the Bakery Hub codebase, I've identified significant opportunities for performance optimization, development workflow acceleration, and code quality improvements. The application is well-structured but has clear patterns of duplication and opportunities for abstraction that, when addressed, will dramatically accelerate feature delivery.

## Current State Analysis

### Codebase Metrics
- **Total Components**: 75+ React components (~19,440 lines)
- **API Routes**: 45 routes with significant auth/validation duplication
- **Translation Keys**: 648 lines per language (en.json, fr.json)
- **Largest Components**: AddEditExpenseModal (805 lines), ProductionLogger (758 lines), AddEditSaleModal (699 lines)
- **Bundle Sizes**: Dashboard (250KB), Expenses (258KB)
- **Build Time**: 11.9s (✓ Good)
- **React Hooks Usage**: 579 occurrences across 89 files
- **Async Functions**: 48 fetch operations across 23 components

### Architecture Strengths
- Clean separation of concerns with App Router
- Strong type safety with TypeScript
- Comprehensive i18n support (FR/EN)
- Multi-restaurant architecture working well
- Solid Prisma schema with proper relationships
- Fast build times (11.9s)

### Key Pain Points Identified
1. **API Route Duplication**: 32 of 45 routes repeat identical auth patterns
2. **Component Bloat**: Large modal components (700-800 lines) with repetitive patterns
3. **Translation Loading**: Entire 648-line files loaded upfront
4. **No Code Splitting**: All charts and modals loaded eagerly
5. **Manual Type Definitions**: Interfaces duplicated across components
6. **Fetch Logic Duplication**: Similar data fetching in 23+ components

---

## 1. Performance Optimization Strategy

### 1.1 Bundle Size Reduction

#### Current Issues
- Dashboard page: 250KB (includes all charts, widgets eagerly)
- Expenses page: 258KB (includes Recharts, multiple modals)
- Translation files: ~130KB (2 languages × 648 lines × ~100 bytes)

#### Optimization Plan

**A. Implement Dynamic Imports for Heavy Components**

```typescript
// Current (eager loading)
import { ExpenseTrendChart } from '@/components/expenses/ExpenseTrendChart'
import { ExpenseCategoryChart } from '@/components/expenses/ExpenseCategoryChart'
import { AddEditExpenseModal } from '@/components/expenses/AddEditExpenseModal'

// Optimized (lazy loading)
import dynamic from 'next/dynamic'

const ExpenseTrendChart = dynamic(() =>
  import('@/components/expenses/ExpenseTrendChart').then(mod => ({ default: mod.ExpenseTrendChart })),
  { loading: () => <ChartSkeleton /> }
)
const ExpenseCategoryChart = dynamic(() => import('@/components/expenses/ExpenseCategoryChart'))
const AddEditExpenseModal = dynamic(() => import('@/components/expenses/AddEditExpenseModal'))
```

**Expected Impact**:
- Reduce initial bundle by 40-60KB per page
- Charts only loaded when data is available
- Modals loaded on user interaction

**Components to Lazy Load (Priority Order)**:
1. All chart components (RevenueChart, ExpensesPieChart, ExpenseTrendChart, etc.) - ~50KB savings
2. All modals (AddEditExpenseModal, AddEditSaleModal, etc.) - ~80KB savings
3. Heavy admin components (CategoriesTab, CustomersTab, ExpenseGroupsTab) - ~30KB savings
4. Recharts library - Only load when charts render (~35KB savings)

**B. Code Split Recharts Library**

```typescript
// lib/lazy-charts.ts
import dynamic from 'next/dynamic'

export const LineChart = dynamic(() =>
  import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false }
)
export const PieChart = dynamic(() =>
  import('recharts').then(mod => ({ default: mod.PieChart })),
  { ssr: false }
)
// Import from this file instead of recharts directly
```

**Expected Impact**: 35KB savings + better tree-shaking

### 1.2 Translation File Optimization

#### Strategy: Namespace-Based Code Splitting

**Current Structure** (648 lines, single file):
```json
{
  "common": {...},
  "nav": {...},
  "dashboard": {...},
  "inventory": {...},
  "expenses": {...},
  "sales": {...},
  "baking": {...}
}
```

**Optimized Structure** (split by namespace):
```
/public/locales/
  en/
    common.json       (50 lines - loaded on every page)
    nav.json          (30 lines - loaded on every page)
    dashboard.json    (80 lines - loaded only on dashboard)
    inventory.json    (120 lines - loaded only on inventory pages)
    expenses.json     (100 lines - loaded only on expenses)
    sales.json        (90 lines - loaded only on sales)
    baking.json       (100 lines - loaded only on baking)
    admin.json        (78 lines - loaded only on admin)
  fr/
    [same structure]
```

**Implementation**:
```typescript
// lib/i18n-loader.ts
export async function loadNamespace(locale: 'en' | 'fr', namespace: string) {
  const translations = await import(`@/public/locales/${locale}/${namespace}.json`)
  return translations.default
}

// components/providers/LocaleProvider.tsx
const [translations, setTranslations] = useState<Record<string, any>>({})

useEffect(() => {
  // Load common + nav on mount
  Promise.all([
    loadNamespace(locale, 'common'),
    loadNamespace(locale, 'nav')
  ]).then(([common, nav]) => {
    setTranslations({ common, nav })
  })
}, [locale])

// Load page-specific translations on demand
export function useNamespace(namespace: string) {
  useEffect(() => {
    if (!translations[namespace]) {
      loadNamespace(locale, namespace).then(ns => {
        setTranslations(prev => ({ ...prev, [namespace]: ns }))
      })
    }
  }, [namespace])
}
```

**Expected Impact**:
- Initial load: 80 lines instead of 648 (8x smaller)
- Page-specific loads: 80-120 lines on demand
- Total network savings: ~50KB initial load

### 1.3 Database Query Optimization

#### Identified Issues from Dashboard API

**Current**: Single massive query with 9 parallel Promise.all operations

**Optimization Opportunities**:

**A. Add Database Indexes**
```prisma
model Sale {
  @@index([restaurantId, status, date])
  @@index([restaurantId, date])
}

model Expense {
  @@index([restaurantId, status, date])
  @@index([restaurantId, paymentStatus])
  @@index([restaurantId, categoryId, date])
}

model InventoryItem {
  @@index([restaurantId, isActive, currentStock])
  @@index([restaurantId, expiryDays])
}

model StockMovement {
  @@index([itemId, type, createdAt])
}
```

**B. Optimize Dashboard Query - Use Aggregations**
```typescript
// Instead of fetching all sales and summing in JS
const approvedSales = await prisma.sale.findMany({ where })
const totalRevenue = approvedSales.reduce((sum, s) => sum + s.totalGNF, 0)

// Use Prisma aggregation (50x faster)
const { _sum: { totalGNF: totalRevenue } } = await prisma.sale.aggregate({
  where: { restaurantId, status: 'Approved', date: { gte: startDate, lte: endDate } },
  _sum: { totalGNF: true }
})
```

**C. Cache Dashboard Data**
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache'

export const getCachedDashboardData = unstable_cache(
  async (restaurantId: string, period: number) => {
    // Fetch dashboard data
    return data
  },
  ['dashboard-data'],
  { revalidate: 300 } // 5 minutes
)
```

**Expected Impact**:
- Dashboard load: 2-3s → 300-500ms
- Database query count: 9 → 5-6
- Reduced data transfer: ~80% for aggregations

### 1.4 Component-Level Optimizations

**A. Memoize Expensive Computations**
```typescript
// Current (recomputes on every render)
const filteredExpenses = expenses.filter(e => e.categoryName.includes(searchQuery))

// Optimized
const filteredExpenses = useMemo(() =>
  expenses.filter(e => e.categoryName.includes(searchQuery)),
  [expenses, searchQuery]
)
```

**B. Virtual Scrolling for Large Lists**
```typescript
// For inventory table (potentially 100+ items)
import { useVirtualizer } from '@tanstack/react-virtual'

// Only render visible rows
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
})
```

---

## 2. Development Workflow Improvements

### 2.1 Custom Skill: Rapid Feature Development

**Skill Name**: `bakery-feature`

**Purpose**: Automate complete feature creation following project conventions

**Usage**: `/bakery-feature [entity-name] [type]`

Example: `/bakery-feature supplier crud`

**What It Generates**:

1. **API Routes** (`/app/api/suppliers/route.ts`)
   - GET with filters, pagination, restaurant validation
   - POST with Zod validation
   - Proper error handling
   - TypeScript types

2. **API Routes** (`/app/api/suppliers/[id]/route.ts`)
   - GET, PUT, DELETE with auth
   - Restaurant access validation

3. **Prisma Types** (auto-extracted from schema)

4. **Component Files**:
   - `components/suppliers/SuppliersTable.tsx` (sorting, filtering, actions)
   - `components/suppliers/AddEditSupplierModal.tsx` (form with validation)
   - `components/suppliers/SupplierCard.tsx` (mobile view)

5. **Page** (`app/suppliers/page.tsx`)
   - Layout matching expenses/sales pattern
   - Summary cards
   - Filters
   - Data fetching

6. **i18n Keys** (both en.json and fr.json)
   ```json
   {
     "suppliers": {
       "title": "Suppliers",
       "addSupplier": "Add Supplier",
       "editSupplier": "Edit Supplier",
       // ... all needed keys
     }
   }
   ```

7. **Validation Schema** (`lib/validations/supplier.ts`)
   ```typescript
   import { z } from 'zod'

   export const supplierSchema = z.object({
     name: z.string().min(1),
     phone: z.string().optional(),
     // ...
   })
   ```

### 2.2 Reusable API Middleware

**Problem**: 32 routes duplicate auth logic

**Current Pattern** (repeated 32 times):
```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const userRestaurant = await prisma.userRestaurant.findUnique({
  where: {
    userId_restaurantId: {
      userId: session.user.id,
      restaurantId,
    },
  },
})

if (!userRestaurant) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Solution: API Middleware Helpers**

```typescript
// lib/api-middleware.ts

export interface AuthenticatedRequest {
  userId: string
  userEmail: string
  userRole: 'Manager' | 'Editor'
}

export interface RestaurantRequest extends AuthenticatedRequest {
  restaurantId: string
}

/**
 * Validate session and return user info
 */
export async function requireAuth(): Promise<AuthenticatedRequest> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new APIError('Unauthorized', 401)
  }

  return {
    userId: session.user.id,
    userEmail: session.user.email!,
    userRole: session.user.role as 'Manager' | 'Editor',
  }
}

/**
 * Validate restaurant access
 */
export async function requireRestaurantAccess(
  userId: string,
  restaurantId: string
): Promise<RestaurantRequest> {
  const userRestaurant = await prisma.userRestaurant.findUnique({
    where: {
      userId_restaurantId: { userId, restaurantId },
    },
  })

  if (!userRestaurant) {
    throw new APIError('Forbidden - No access to this restaurant', 403)
  }

  return { userId, restaurantId } as RestaurantRequest
}

/**
 * Require Manager role
 */
export function requireManager(auth: AuthenticatedRequest): void {
  if (auth.userRole !== 'Manager') {
    throw new APIError('Forbidden - Manager role required', 403)
  }
}

/**
 * Custom API Error for consistent error responses
 */
export class APIError extends Error {
  constructor(public message: string, public status: number) {
    super(message)
  }
}

/**
 * Error handler wrapper
 */
export function withErrorHandling<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  return handler()
    .then(data => NextResponse.json(data))
    .catch(error => {
      if (error instanceof APIError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      console.error('Unexpected API error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    })
}

/**
 * Parse and validate query params
 */
export function getRequiredParam(searchParams: URLSearchParams, name: string): string {
  const value = searchParams.get(name)
  if (!value) {
    throw new APIError(`${name} is required`, 400)
  }
  return value
}
```

**Usage in API Routes**:

```typescript
// app/api/expenses/route.ts

import { requireAuth, requireRestaurantAccess, withErrorHandling, getRequiredParam } from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Auth in 2 lines instead of 20
    const auth = await requireAuth()
    const { restaurantId } = await requireRestaurantAccess(
      auth.userId,
      getRequiredParam(new URL(request.url).searchParams, 'restaurantId')
    )

    // Business logic
    const expenses = await prisma.expense.findMany({
      where: { restaurantId },
    })

    return { expenses }
  })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await requireAuth()
    requireManager(auth) // Throws if not manager

    const body = await request.json()
    const { restaurantId } = await requireRestaurantAccess(auth.userId, body.restaurantId)

    // Validate with Zod
    const validated = expenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: { ...validated, restaurantId, submittedById: auth.userId },
    })

    return { expense }
  })
}
```

**Expected Impact**:
- Reduce API route boilerplate by 60-70%
- Consistent error handling across all routes
- Type-safe request context
- Easier to add new middleware (rate limiting, logging, etc.)

### 2.3 Component Library for Forms

**Problem**: Large modals (700-800 lines) with repetitive patterns

**Solution: Extract Reusable Form Components**

```typescript
// components/ui/form/FormModal.tsx
interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onSubmit: () => void
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function FormModal({ isOpen, onClose, title, children, onSubmit, loading, size = 'lg' }: FormModalProps) {
  // Consistent modal wrapper with proper transitions, backdrop, close handlers
  // Dark mode support built-in
  // Responsive sizing
}

// components/ui/form/FormField.tsx
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  // Consistent field layout with label, error message, required indicator
}

// components/ui/form/FormInput.tsx
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function FormInput({ label, error, ...inputProps }: FormInputProps) {
  // Pre-styled input with dark mode, error states, etc.
  return (
    <FormField label={label} error={error} required={inputProps.required}>
      <input
        {...inputProps}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />
    </FormField>
  )
}

// components/ui/form/FormSelect.tsx
// components/ui/form/FormTextarea.tsx
// components/ui/form/FormDatePicker.tsx
// components/ui/form/FormCurrencyInput.tsx
// etc.
```

**Usage in Modals**:

```typescript
// Before: 805 lines
export function AddEditExpenseModal({ ... }) {
  // 100 lines of state
  // 200 lines of JSX for modal wrapper
  // 400 lines of form fields
  // 105 lines of validation logic
}

// After: ~300 lines
import { FormModal, FormInput, FormSelect, FormTextarea, FormCurrencyInput } from '@/components/ui/form'

export function AddEditExpenseModal({ ... }) {
  const { register, handleSubmit, errors } = useForm()

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('expenses.addExpense')}
      onSubmit={handleSubmit(onSave)}
      loading={loading}
    >
      <FormInput
        label={t('expenses.amount')}
        type="number"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <FormSelect
        label={t('expenses.category')}
        options={categories}
        error={errors.category?.message}
        {...register('category')}
      />

      {/* Much cleaner! */}
    </FormModal>
  )
}
```

### 2.4 Data Fetching Hooks

**Problem**: 44 fetch operations with similar patterns

**Solution: Custom Hooks for Common Operations**

```typescript
// hooks/useRestaurantData.ts

/**
 * Fetch data for current restaurant with automatic refetch on restaurant change
 */
export function useRestaurantData<T>(
  endpoint: string,
  options?: RequestInit
) {
  const { currentRestaurant } = useRestaurant()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!currentRestaurant?.id) return

    setLoading(true)
    try {
      const url = endpoint.includes('?')
        ? `${endpoint}&restaurantId=${currentRestaurant.id}`
        : `${endpoint}?restaurantId=${currentRestaurant.id}`

      const res = await fetch(url, options)

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch')
      }

      const data = await res.json()
      setData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [currentRestaurant?.id, endpoint, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// hooks/useExpenses.ts
export function useExpenses(filters?: ExpenseFilters) {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.categoryId) params.append('categoryId', filters.categoryId)
  // ... add other filters

  return useRestaurantData<{ expenses: Expense[]; summary: ExpensesSummary }>(
    `/api/expenses?${params}`
  )
}

// hooks/useSales.ts
export function useSales(filters?: SaleFilters) {
  // Similar pattern
}

// hooks/useInventory.ts
export function useInventory() {
  // Similar pattern
}
```

**Usage**:
```typescript
// Before: 30 lines of fetch logic in every component
const [expenses, setExpenses] = useState([])
const [loading, setLoading] = useState(true)
const fetchExpenses = useCallback(async () => { /* ... */ }, [])
useEffect(() => { fetchExpenses() }, [fetchExpenses])

// After: 1 line
const { data, loading, refetch } = useExpenses({ status: 'Pending' })
```

---

## 3. Code Quality & Patterns

### 3.1 Pattern Audit Results

**Strengths**:
- Consistent dark mode support across components
- Strong TypeScript usage
- Good component structure (providers, layout, feature components)
- Prisma schema well-designed

**Inconsistencies Found**:

1. **Error Handling**: Mixed approaches
   - Some components use try/catch with alert()
   - Some use toast notifications
   - Some just console.error
   - **Recommendation**: Standardize on Toast component + error boundaries

2. **Date Formatting**: Scattered logic
   - Some use Intl.DateTimeFormat
   - Some use manual string manipulation
   - Recently added date-utils.ts but not widely adopted
   - **Recommendation**: Migrate all to date-utils.ts

3. **Currency Formatting**: Two different patterns
   ```typescript
   // Pattern 1 (dashboard)
   const formatGNF = (value: number) => {
     return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(value)
   }

   // Pattern 2 (expenses)
   const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat(locale === 'fr' ? 'fr-GN' : 'en-GN', {
       style: 'decimal',
       minimumFractionDigits: 0,
       maximumFractionDigits: 0,
     }).format(amount) + ' GNF'
   }
   ```
   - **Recommendation**: Create hooks/useFormatters.ts

4. **Loading States**: Different skeleton implementations
   - **Recommendation**: Create components/ui/Skeleton.tsx

### 3.2 Recommended Architectural Improvements

#### A. Service Layer Pattern

**Problem**: Business logic mixed with API route handlers

**Solution**:
```typescript
// services/expense.service.ts

export class ExpenseService {
  /**
   * Create expense with inventory updates
   */
  static async createExpense(data: CreateExpenseInput, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // Create expense
      const expense = await tx.expense.create({
        data: {
          ...data,
          submittedById: userId,
          status: 'Pending',
        },
      })

      // If inventory purchase, create stock movements
      if (data.isInventoryPurchase && data.expenseItems) {
        await Promise.all(
          data.expenseItems.map(item =>
            tx.stockMovement.create({
              data: {
                itemId: item.inventoryItemId,
                type: 'Purchase',
                quantity: item.quantity,
                unitCostGNF: item.unitCostGNF,
                expenseId: expense.id,
              },
            })
          )
        )
      }

      return expense
    })
  }

  /**
   * Get expenses with filters
   */
  static async getExpenses(restaurantId: string, filters: ExpenseFilters) {
    // Query logic here
  }

  /**
   * Approve expense (Manager only)
   */
  static async approveExpense(expenseId: string, managerId: string) {
    // Approval logic
  }
}

// services/inventory.service.ts
export class InventoryService {
  static async adjustStock(itemId: string, adjustment: StockAdjustment) { }
  static async getLowStockItems(restaurantId: string) { }
  static async getExpiringItems(restaurantId: string) { }
}
```

**Benefits**:
- Business logic testable in isolation
- Reusable across API routes
- Easier to maintain complex operations
- Transactions handled properly

#### B. Validation Layer with Zod

```typescript
// lib/validations/expense.ts

import { z } from 'zod'

export const expenseSchema = z.object({
  date: z.string().datetime(),
  categoryId: z.string().uuid().optional(),
  categoryName: z.string().min(1),
  amountGNF: z.number().positive(),
  paymentMethod: z.enum(['Cash', 'OrangeMoney', 'Card']),
  description: z.string().optional(),
  transactionRef: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  isInventoryPurchase: z.boolean().default(false),
  expenseItems: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    unitCostGNF: z.number().positive(),
  })).optional(),
  comments: z.string().optional(),
})

export type CreateExpenseInput = z.infer<typeof expenseSchema>

// Usage in API route
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validation throws if invalid
  const validated = expenseSchema.parse(body)

  const expense = await ExpenseService.createExpense(validated, userId)
  return NextResponse.json({ expense })
}
```

### 3.3 Testing Strategy

**Current State**: No tests

**Recommended Approach** (pragmatic, not full TDD):

**Priority 1: Critical Business Logic**
```typescript
// services/__tests__/expense.service.test.ts

describe('ExpenseService', () => {
  it('should create expense with inventory updates', async () => {
    const expense = await ExpenseService.createExpense({
      amountGNF: 50000,
      isInventoryPurchase: true,
      expenseItems: [
        { inventoryItemId: '123', quantity: 10, unitCostGNF: 5000 }
      ]
    }, 'user-123')

    expect(expense).toBeDefined()
    // Verify stock movement created
    const movement = await prisma.stockMovement.findFirst({
      where: { expenseId: expense.id }
    })
    expect(movement).toBeDefined()
  })
})
```

**Priority 2: API Middleware**
```typescript
// lib/__tests__/api-middleware.test.ts

describe('requireAuth', () => {
  it('should throw 401 if no session', async () => {
    mockGetServerSession.mockResolvedValue(null)
    await expect(requireAuth()).rejects.toThrow(APIError)
  })
})
```

**Priority 3: Utility Functions**
```typescript
// lib/__tests__/inventory-helpers.test.ts

describe('getExpiryInfo', () => {
  it('should calculate expiry correctly', () => {
    const info = getExpiryInfo(
      { expiryDays: 7 },
      new Date('2024-01-01'),
      3
    )
    expect(info.status).toBe('warning')
  })
})
```

**Testing Tools**:
- Jest + Testing Library (standard React testing)
- Prisma test helpers (database mocking)
- MSW for API mocking
- Playwright for critical user flows (optional)

---

## 4. Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
**Priority: HIGH - Immediate Impact**

1. **Add dynamic imports to all chart components**
   - Files: `app/dashboard/page.tsx`, `app/finances/expenses/page.tsx`, `app/finances/sales/page.tsx`
   - Expected: 50KB bundle savings

2. **Lazy load all modals**
   - Files: All page components that import modals
   - Expected: 80KB bundle savings

3. **Extract API middleware helpers**
   - Create: `lib/api-middleware.ts`
   - Update: 32 API route files
   - Expected: 600+ lines of code removed

4. **Add database indexes**
   - File: `prisma/schema.prisma`
   - Run migration
   - Expected: 3-5x faster queries

**Deliverables**:
- 40% faster page loads
- 60% less API boilerplate
- Dashboard load: 2-3s → 500ms

### Phase 2: Developer Experience (2-3 days)
**Priority: HIGH - Long-term Velocity**

1. **Create bakery-feature skill**
   - Location: `.claude/skills/bakery-feature/`
   - Templates for API routes, components, pages, i18n
   - Expected: 3-4x faster feature development

2. **Build form component library**
   - Create: `components/ui/form/` directory
   - Components: FormModal, FormInput, FormSelect, FormTextarea, etc.
   - Refactor: Top 3 largest modals as proof of concept
   - Expected: 700-line modals → 200-300 lines

3. **Create data fetching hooks**
   - Create: `hooks/useRestaurantData.ts`, `hooks/useExpenses.ts`, etc.
   - Refactor: 5-10 components to use new hooks
   - Expected: 30 lines → 1 line per fetch operation

4. **Standardize formatters (currency, dates)**
   - Create: `hooks/useFormatters.ts`
   - Migrate: All components using manual formatting
   - Expected: Consistent formatting across app

**Deliverables**:
- Custom skill for rapid CRUD generation
- Reusable form components (60% code reduction in modals)
- Standard data fetching patterns
- Consistent formatting utilities

### Phase 3: Translation Optimization (1 day)
**Priority: MEDIUM - Bundle Size**

1. **Split translation files by namespace**
   - Restructure: `public/locales/` directory
   - Split: en.json and fr.json into 8 files each
   - Expected: 648 lines → 80 lines initial load

2. **Update LocaleProvider for lazy loading**
   - Create: `lib/i18n-loader.ts`
   - Update: `components/providers/LocaleProvider.tsx`
   - Add: `useNamespace` hook

3. **Test translation loading**
   - Verify: All pages load correct namespaces
   - Check: No missing translation keys
   - Measure: Bundle size reduction

**Deliverables**:
- 50KB smaller initial bundle
- Faster initial page load
- On-demand translation loading

### Phase 4: Architecture (2-3 days)
**Priority: MEDIUM - Maintainability**

1. **Create service layer for expenses and sales**
   - Create: `services/expense.service.ts`, `services/sale.service.ts`
   - Move: Business logic from API routes to services
   - Test: Service methods in isolation

2. **Add Zod validation schemas**
   - Create: `lib/validations/` directory
   - Define: Schemas for all main entities
   - Use: In API routes for request validation

3. **Implement repository pattern** (optional)
   - Create: `repositories/` directory if needed
   - Extract: Complex query logic

4. **Set up testing infrastructure**
   - Install: Jest, Testing Library
   - Create: Test utilities for Prisma mocking
   - Write: Tests for critical business logic

**Deliverables**:
- Testable service layer
- Type-safe validation
- Test coverage for critical paths
- Cleaner separation of concerns

### Phase 5: Performance Tuning (1-2 days)
**Priority: LOW - Polish**

1. **Optimize dashboard queries with aggregations**
   - File: `app/api/dashboard/route.ts`
   - Replace: findMany + JS sum with Prisma aggregate
   - Expected: 50x faster query execution

2. **Add caching layer**
   - Create: `lib/cache.ts`
   - Add: Next.js unstable_cache for dashboard
   - Configure: 5-minute revalidation

3. **Implement virtual scrolling for large tables**
   - Install: `@tanstack/react-virtual`
   - Update: InventoryTable, ExpensesTable, SalesTable
   - Expected: Better performance with 100+ items

4. **Add loading skeletons everywhere**
   - Create: `components/ui/Skeleton.tsx`
   - Add: Consistent loading states across all pages

**Deliverables**:
- Sub-second dashboard loads
- Better perceived performance
- Smooth scrolling for large datasets
- Professional loading states

---

## 5. Metrics & Success Criteria

### Performance Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Dashboard bundle size | 250KB | 150KB | Next.js build output |
| Expenses bundle size | 258KB | 170KB | Next.js build output |
| Initial translation load | 130KB | 25KB | Network tab |
| Dashboard API response | 2-3s | 300-500ms | Network tab |
| Build time | 11.9s | <15s | `npm run build` |
| Page load (FCP) | ~2s | <1s | Lighthouse |
| Time to Interactive (TTI) | ~3s | <1.5s | Lighthouse |

### Development Velocity Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Lines per new CRUD feature | ~1500 | ~500 | Manual counting |
| Time to add new entity | 4-6 hours | 1-2 hours | Time tracking |
| API route boilerplate | 50 lines | 15 lines | Line count |
| Modal component size | 700-800 lines | 200-300 lines | Line count |
| Code duplication (fetch logic) | 44 instances | <10 instances | Code search |

### Quality Metrics

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Test coverage | 0% | 60% critical paths | Jest coverage report |
| TypeScript errors | 0 | 0 | `npm run typecheck` |
| ESLint warnings | ? | 0 | `npm run lint` |
| Bundle size alerts | None | Set up | Bundlesize package |
| Lighthouse score | ? | >90 | Lighthouse CI |

---

## 6. Maintenance Best Practices

### Documentation Requirements
Every new feature should include:
1. API documentation in route file comments
2. Component props documented with JSDoc
3. Translation keys in both EN and FR
4. Service method descriptions

### Code Review Checklist
- [ ] Dark mode support verified
- [ ] i18n keys added to both languages
- [ ] API route uses api-middleware helpers
- [ ] Loading states implemented
- [ ] Error handling with Toast
- [ ] Mobile responsive
- [ ] TypeScript types exported
- [ ] No duplicate code patterns

### Performance Monitoring
```typescript
// Add to layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  )
}
```

---

## 7. Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes from dynamic imports | Low | Medium | Test all pages after changes |
| Translation split breaks existing keys | Medium | High | Comprehensive testing, gradual rollout |
| API middleware changes break routes | Low | High | Update one route at a time, test thoroughly |
| Service layer adds complexity | Low | Medium | Start with 2-3 services, iterate |
| Database migration issues | Low | High | Test in dev first, backup prod before migration |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Time investment doesn't pay off | Low | Medium | Focus on Phase 1 & 2 quick wins first |
| Breaking existing functionality | Medium | High | Incremental changes, thorough testing |
| Learning curve for new patterns | Medium | Low | Document patterns, pair programming |
| Maintenance overhead increases | Low | Medium | Keep patterns simple, document well |

---

## 8. Next Steps

### Immediate Actions (This Week)

1. **Review this plan** with the team
2. **Prioritize phases** based on business needs
3. **Start Phase 1** (quick wins) if approved
4. **Set up metrics tracking** (bundle size, page load times)

### Decision Points

**Option A: Full Implementation**
- Execute all 5 phases over 2-3 weeks
- Maximum impact on both performance and velocity
- Requires dedicated time investment

**Option B: Quick Wins Only**
- Execute Phase 1 only (1-2 days)
- 40% performance improvement
- Minimal risk, immediate ROI

**Option C: Developer Velocity Focus**
- Execute Phase 1 + Phase 2 (3-5 days)
- Performance boost + workflow acceleration
- Best balance of short-term and long-term gains

**Option D: Custom Selection**
- Pick specific improvements from each phase
- Tailored to immediate needs
- May miss synergies between phases

### Questions to Answer

1. **What's the priority**: Speed to market or technical excellence?
2. **Timeline**: How much time can be dedicated to optimization?
3. **Resources**: Who will implement these changes?
4. **Testing**: What level of testing is required before each phase?
5. **Deployment**: Gradual rollout or all at once?

---

## Appendix

### A. File Inventory

**Critical files for Phase 1**:
- `lib/api-middleware.ts` (create)
- `app/dashboard/page.tsx` (modify)
- `app/finances/expenses/page.tsx` (modify)
- `prisma/schema.prisma` (add indexes)
- All API routes in `app/api/` (refactor auth)

**Critical files for Phase 2**:
- `.claude/skills/bakery-feature/skill.md` (create)
- `components/ui/form/` (create directory)
- `hooks/useRestaurantData.ts` (create)
- `hooks/useFormatters.ts` (create)

### B. Technology Stack Additions

**Required**:
- None (all optimizations use existing stack)

**Optional**:
- `zod` (if not already installed) - for validation
- `@tanstack/react-virtual` - for virtual scrolling
- `jest` + `@testing-library/react` - for testing
- `@vercel/analytics` + `@vercel/speed-insights` - for monitoring

### C. Reference Links

- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [React Virtual](https://tanstack.com/virtual/latest)
- [Zod](https://zod.dev/)

---

**End of Development Acceleration Plan**

Last Updated: 2026-01-26
Next Review: After Phase 1 completion
