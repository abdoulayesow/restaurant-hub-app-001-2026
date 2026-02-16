import type { UserRole } from '@prisma/client'

// Re-export UserRole type for convenience
export type { UserRole }

// =============================================================================
// ROLE CHECKS
// =============================================================================

export function isOwner(role: UserRole | string | null | undefined): boolean {
  return role === 'Owner'
}

export function isRestaurantManager(role: UserRole | string | null | undefined): boolean {
  return role === 'RestaurantManager'
}

export function isBaker(role: UserRole | string | null | undefined): boolean {
  return role === 'Baker'
}

export function isPastryChef(role: UserRole | string | null | undefined): boolean {
  return role === 'PastryChef'
}

export function isCashier(role: UserRole | string | null | undefined): boolean {
  return role === 'Cashier'
}

// Legacy role checks (for backward compatibility during migration)
export function isManagerRole(role: UserRole | string | null | undefined): boolean {
  return role === 'Manager' || role === 'Owner'
}

export function isEditorRole(role: UserRole | string | null | undefined): boolean {
  return role === 'Editor' || isEmployeeRole(role)
}

// =============================================================================
// ROLE CATEGORIES
// =============================================================================

// Employee roles (access /editor pages, not main dashboard)
export function isEmployeeRole(role: UserRole | string | null | undefined): boolean {
  return (
    role === 'RestaurantManager' ||
    role === 'Baker' ||
    role === 'PastryChef' ||
    role === 'Cashier' ||
    role === 'Editor' // Legacy
  )
}

// Production roles (can record production)
export function isProductionRole(role: UserRole | string | null | undefined): boolean {
  return (
    role === 'Owner' ||
    role === 'RestaurantManager' ||
    role === 'Baker' ||
    role === 'PastryChef' ||
    role === 'Manager' || // Legacy
    role === 'Editor' // Legacy
  )
}

// Sales/cashier roles (can record sales and expenses)
export function isCashierRole(role: UserRole | string | null | undefined): boolean {
  return (
    role === 'Owner' ||
    role === 'RestaurantManager' ||
    role === 'Cashier' ||
    role === 'Manager' || // Legacy
    role === 'Editor' // Legacy
  )
}

// =============================================================================
// PERMISSION CHECKS
// =============================================================================

// Can access main dashboard (/dashboard) - Owner only
export function canAccessDashboard(role: UserRole | string | null | undefined): boolean {
  return isOwner(role) || role === 'Manager' // Legacy Manager maps to Owner
}

// Can access editor pages (/editor/*) - All employee roles
export function canAccessEditor(role: UserRole | string | null | undefined): boolean {
  return isEmployeeRole(role)
}

// Can record production (/editor/production or /production)
export function canRecordProduction(role: UserRole | string | null | undefined): boolean {
  return isProductionRole(role)
}

// Can record sales (/editor/sales or /sales)
export function canRecordSales(role: UserRole | string | null | undefined): boolean {
  return isCashierRole(role)
}

// Can record expenses (/editor/expenses or /expenses)
export function canRecordExpenses(role: UserRole | string | null | undefined): boolean {
  return isCashierRole(role)
}

// Can approve/reject submissions - Owner only
export function canApprove(role: UserRole | string | null | undefined): boolean {
  return isOwner(role) || role === 'Manager' // Legacy
}

// Can edit approved items - Owner only
export function canEditApproved(role: UserRole | string | null | undefined): boolean {
  return isOwner(role) || role === 'Manager' // Legacy
}

// Can access settings (/settings) - Owner only
export function canAccessSettings(role: UserRole | string | null | undefined): boolean {
  return isOwner(role) || role === 'Manager' // Legacy
}

// Can access admin pages (/admin/*) - Owner only
export function canAccessAdmin(role: UserRole | string | null | undefined): boolean {
  return isOwner(role) || role === 'Manager' // Legacy
}

// Can access bank pages (/finances/bank) - Owner only
export function canAccessBank(role: UserRole | string | null | undefined): boolean {
  return isOwner(role)
}

// Can collect debt payments - Owner, RestaurantManager, and Cashier
// Note: This creates a bank transaction (deposit), so it's restricted to roles that handle money
export function canCollectDebtPayments(role: UserRole | string | null | undefined): boolean {
  return isCashierRole(role) // Owner, RestaurantManager, Cashier, and legacy roles
}

// Can view inventory (read-only access) - All roles
export function canViewInventory(role: UserRole | string | null | undefined): boolean {
  return !!role // Any authenticated user with a role can view
}

// Can adjust stock directly (manual corrections, waste, reconciliation) - Owner and RestaurantManager only
// Note: Baker/Cashier affect stock indirectly through production logs and expense payments
export function canAdjustStock(role: UserRole | string | null | undefined): boolean {
  return isOwner(role) || isRestaurantManager(role) || role === 'Manager' // Legacy
}

// =============================================================================
// ROLE DISPLAY
// =============================================================================

// Get display name for role (French)
export function getRoleDisplayNameFr(role: UserRole | string | null | undefined): string {
  switch (role) {
    case 'Owner':
      return 'Propriétaire'
    case 'RestaurantManager':
      return 'Gérant'
    case 'Baker':
      return 'Boulanger'
    case 'PastryChef':
      return 'Pâtissier'
    case 'Cashier':
      return 'Caissier'
    case 'Manager':
      return 'Manager' // Legacy
    case 'Editor':
      return 'Éditeur' // Legacy
    default:
      return role || 'Inconnu'
  }
}

// Get display name for role (English)
export function getRoleDisplayNameEn(role: UserRole | string | null | undefined): string {
  switch (role) {
    case 'Owner':
      return 'Owner'
    case 'RestaurantManager':
      return 'Restaurant Manager'
    case 'Baker':
      return 'Baker'
    case 'PastryChef':
      return 'Pastry Chef'
    case 'Cashier':
      return 'Cashier'
    case 'Manager':
      return 'Manager' // Legacy
    case 'Editor':
      return 'Editor' // Legacy
    default:
      return role || 'Unknown'
  }
}

// Get role display name based on locale
export function getRoleDisplayName(
  role: UserRole | string | null | undefined,
  locale: 'fr' | 'en' = 'fr'
): string {
  return locale === 'fr' ? getRoleDisplayNameFr(role) : getRoleDisplayNameEn(role)
}
