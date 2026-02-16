# Role-Based Access Control (RBAC) Plan

**Created**: January 30, 2026
**Status**: 📋 Planned
**Priority**: High

## Overview

This document outlines the expanded role-based access control system for Bakery Hub. The current simple Manager/Editor model will be replaced with a more granular system that reflects real bakery operations.

## Business Context

The bakery has different types of employees with distinct responsibilities:
- **Owner** (remote in Atlanta): Needs full visibility and approval authority
- **Restaurant Manager** (on-site): Oversees daily operations
- **Baker (Boulanger)**: Handles bread production
- **Pastry Chef (Pâtissier)**: Handles pastry production
- **Cashier (Caissier)**: Handles sales and expense recording

## Current State

### Current Roles (Prisma Schema)

```prisma
enum UserRole {
  Manager
  Editor
}
```

### Current Access Model

| Role | Access |
|------|--------|
| Manager | Full access to all pages |
| Editor | Limited access (submit only, no approvals) |

## Proposed State

### New Roles

```prisma
enum UserRole {
  Owner           // Propriétaire - full access
  RestaurantManager  // Gérant - operational access
  Baker           // Boulanger - production only
  PastryChef      // Pâtissier - production only  
  Cashier         // Caissier - sales & expenses only
}
```

### Role Hierarchy & Permissions

| Role | FR Name | Production | Sales | Expenses | Approvals | Analytics | Settings |
|------|---------|------------|-------|----------|-----------|-----------|----------|
| Owner | Propriétaire | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| RestaurantManager | Gérant | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Baker | Boulanger | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PastryChef | Pâtissier | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cashier | Caissier | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |

**Note**: Owner does NOT use `/editor` pages - they access management/analytics pages. All other roles ONLY access `/editor` pages.

### Page Access Matrix

| Page | Owner | RestaurantManager | Baker | PastryChef | Cashier |
|------|-------|-------------------|-------|------------|---------|
| `/` (Dashboard) | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/finances/sales` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/finances/expenses` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/finances/bank` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/finances/debts` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/baking/production` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/baking/inventory` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/baking/products` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/settings/*` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/editor/production` | ❌ | ✅ | ✅ | ✅ | ❌ |
| `/editor/sales` | ❌ | ✅ | ❌ | ❌ | ✅ |
| `/editor/expenses` | ❌ | ✅ | ❌ | ❌ | ✅ |

### Restaurant Assignment

Employees are assigned to specific restaurants via `UserRestaurant`:

```prisma
model UserRestaurant {
  id           String     @id @default(uuid())
  userId       String
  restaurantId String
  role         UserRole   // Role can vary per restaurant
  user         User       @relation(...)
  restaurant   Restaurant @relation(...)
  
  @@unique([userId, restaurantId])
}
```

**Note**: An employee can be assigned to multiple restaurants with potentially different roles (e.g., Baker at one location, RestaurantManager at another).

## Approval Workflow

### Who Approves What

| Action | Created By | Approved By |
|--------|------------|-------------|
| Production log | Baker, PastryChef, RestaurantManager | Owner |
| Sale record | Cashier, RestaurantManager | Owner |
| Expense record | Cashier, RestaurantManager | Owner |
| Bank transaction | System (from above) | Owner |
| Debt payment | Cashier, RestaurantManager | Owner |

### Status Flow

```
Pending → Approved (by Owner)
       → Rejected (by Owner)
```

## Implementation Plan

### Phase 1: Database Schema

1. Update `UserRole` enum with new roles
2. Optionally move role to `UserRestaurant` for per-restaurant roles
3. Create migration
4. Update seed script

### Phase 2: Middleware & Authorization

1. Create role-based middleware for API routes
2. Create page-level access guards
3. Update session to include role information

### Phase 3: UI Updates

1. Update navigation to show role-appropriate pages
2. Create `/editor` layout and pages
3. Update user profile to show role
4. Add role management in settings (Owner only)

### Phase 4: Editor Pages

1. `/editor/production` - Simplified production entry form
2. `/editor/sales` - Simplified sales entry form
3. `/editor/expenses` - Simplified expense entry form

## Migration Strategy

### From Current to New Roles

| Current Role | New Role | Rationale |
|--------------|----------|-----------|
| Manager | Owner | Full access users become Owners |
| Editor | Cashier | Default for existing editors |

### Data Migration

```sql
-- Migrate existing users
UPDATE "User" SET role = 'Owner' WHERE role = 'Manager';
UPDATE "User" SET role = 'Cashier' WHERE role = 'Editor';
```

## Security Considerations

1. **API Routes**: Every API route must verify user role before allowing operations
2. **Page Guards**: Client-side guards redirect unauthorized users
3. **Per-Restaurant Roles**: Check `UserRestaurant.role` for restaurant-specific permissions
4. **Session Security**: Role must be verified server-side, not just from JWT

## Open Questions

1. Should role be on `User` (global) or `UserRestaurant` (per-restaurant)?
2. Do we need a separate "viewer" role for investors/partners?
3. Should RestaurantManager be able to approve their own entries?
4. How to handle role changes (audit trail)?

## Related Documents

- [BANK-TRANSACTION-UNIFICATION.md](BANK-TRANSACTION-UNIFICATION.md) - Approval workflow for transactions
- [FEATURE-REQUIREMENTS-JAN2026.md](FEATURE-REQUIREMENTS-JAN2026.md) - Current feature roadmap

---

## Dual Role System (Technical Documentation)

**Last Updated**: 2026-02-05
**Status**: ⚠️ Partially Migrated - Action Required

### Overview

The system has TWO role fields that serve different purposes:

| Field | Location | Purpose | Default |
|-------|----------|---------|---------|
| `User.role` | User model | Global/session role (legacy) | `Editor` |
| `UserRestaurant.role` | UserRestaurant junction table | Per-restaurant role (current standard) | `RestaurantManager` |

### How They Work

**User.role (Global)**
- Stored in the `User` table
- Loaded into JWT during authentication (`lib/auth.ts:119`)
- Available via `session.user.role` in API routes
- Originally intended for simple Manager/Editor distinction
- **Legacy field** - should eventually be deprecated

**UserRestaurant.role (Per-Restaurant)**
- Stored in the `UserRestaurant` junction table
- Allows different roles at different restaurants (e.g., Owner at Restaurant A, Baker at Restaurant B)
- Accessed via `authorizeRestaurantAccess()` helper in `lib/auth.ts`
- **Current standard** - all new code should use this

### Authorization Patterns

**Correct Pattern (Per-Restaurant Role)**
```typescript
import { authorizeRestaurantAccess } from '@/lib/auth'
import { canRecordSales } from '@/lib/roles'

const auth = await authorizeRestaurantAccess(
  session.user.id,
  restaurantId,
  canRecordSales,
  'Your role does not have permission to record sales'
)
if (!auth.authorized) {
  return NextResponse.json({ error: auth.error }, { status: auth.status })
}
// auth.role contains the user's role at this specific restaurant
```

**Legacy Pattern (Global Role) - DO NOT USE FOR NEW CODE**
```typescript
// This checks User.role, NOT UserRestaurant.role
if (!isManagerRole(session.user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Current API Authorization Audit (2026-02-05)

**APIs Using `authorizeRestaurantAccess` (Correct):**
- `POST /api/sales` - Sales creation
- `PATCH /api/sales/[id]` - Sales editing
- `POST /api/sales/[id]/approve` - Sales approval
- `POST /api/expenses` - Expense creation
- `PATCH /api/expenses/[id]` - Expense editing
- `POST /api/debts/[id]/payments` - Debt payment collection
- `POST /api/stock-movements` - Stock movement creation
- `POST /api/inventory/[id]/adjust` - Inventory adjustments
- `POST /api/production` - Production log creation

**APIs Using `session.user.role` (Legacy - Needs Migration):**
- `POST/PUT/DELETE /api/products/[id]` - Product management
- `POST /api/inventory` - Inventory item creation
- `PUT/DELETE /api/inventory/[id]` - Inventory item management
- `GET/POST /api/bank/transactions` - Bank transactions
- `GET/PUT/DELETE /api/bank/transactions/[id]` - Bank transaction management
- `GET /api/bank/balances` - Bank balances
- `GET /api/bank/analytics` - Bank analytics
- `PATCH /api/reconciliation/[id]` - Stock reconciliation approval
- `PATCH/DELETE /api/production/[id]` - Production status/delete
- `POST /api/expenses/[id]/payments` - Expense payments

### Security Implications

**Risk**: A user with `User.role = 'Owner'` (global) but `UserRestaurant.role = 'Cashier'` at a specific restaurant could bypass restrictions on legacy APIs.

**Mitigation**: Most critical operations (sales, expenses, debts, stock) already use per-restaurant authorization. Bank-related APIs using global role are acceptable since bank access is Owner-only regardless of restaurant.

### Migration Recommendation

**Priority**: Medium (not blocking, but should be addressed)

1. **Bank APIs** - Keep using `session.user.role` for Owner check (acceptable since bank access is global Owner privilege)
2. **Products/Inventory CRUD** - Migrate to `authorizeRestaurantAccess`
3. **Reconciliation/Production Admin** - Migrate to `authorizeRestaurantAccess`
4. **Eventually**: Consider deprecating `User.role` field entirely

### When to Use Each

| Scenario | Use |
|----------|-----|
| Restaurant-scoped operations (sales, expenses, production) | `authorizeRestaurantAccess()` |
| Owner-only global features (bank, settings) | `session.user.role` is acceptable |
| New API endpoints | Always use `authorizeRestaurantAccess()` |

---

## Implementation Checklist

- [x] Finalize role names (FR/EN) - Completed in lib/roles.ts
- [x] Decide: role on User vs UserRestaurant - Using UserRestaurant.role (per-restaurant)
- [x] Create Prisma migration - UserRole enum updated in schema
- [x] Update seed.ts with test users for each role
- [x] Create middleware for role checking - lib/roles.ts permission functions
- [x] Build `/editor` layout and navigation - app/editor/page.tsx with role-based quick actions
- [x] Build `/editor/production` page - app/editor/production/page.tsx
- [x] Build `/editor/sales` page - app/editor/sales/page.tsx
- [x] Build `/editor/expenses` page - app/editor/expenses/page.tsx
- [x] Update existing pages with access guards - All 11 pages updated

### Remaining Tasks
- [x] Update critical API routes to check UserRestaurant.role for authorization (sales, expenses, debts, stock - Phase 1)
- [ ] Migrate remaining APIs (products, inventory CRUD, reconciliation) - Phase 2
- [ ] Test complete RBAC flow with different roles
- [x] Document dual role system - Completed 2026-02-05
