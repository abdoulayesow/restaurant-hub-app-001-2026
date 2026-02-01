# Refactoring Safety Guidelines

## Overview

These guidelines ensure refactoring changes are safe and don't introduce regressions. The goal is to modify code structure without changing behavior.

## Core Principles

1. **Zero Behavioral Changes** - Users should not notice any difference
2. **Incremental Changes** - Small, verifiable steps
3. **Verify After Each Step** - Don't batch risky changes
4. **Preserve All Exports** - Maintain backwards compatibility
5. **Test Before and After** - Same inputs, same outputs

## Safe Refactoring Patterns

### Extracting Configuration

**When to Use:** Large files with embedded configuration data

**Pattern:**
```typescript
// BEFORE: NavigationHeader.tsx (500+ lines)
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Sales', href: '/sales', icon: DollarSign },
  // ... 50 more items
]

// AFTER: nav-config.ts (new file)
export const navigationItems = [...]

// NavigationHeader.tsx (imports config)
import { navigationItems } from './nav-config'
```

**Safety Checks:**
- [ ] All items transferred exactly (no typos, no missing items)
- [ ] Types exported if used externally
- [ ] Original component imports correctly
- [ ] All navigation links still work

### Creating Barrel Exports

**When to Use:** Frequently imported components from same directory

**Pattern:**
```typescript
// BEFORE: Multiple imports
import { NavigationHeader } from '@/components/layout/NavigationHeader'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { RestaurantDrawer } from '@/components/layout/RestaurantDrawer'

// AFTER: Create index.ts
// components/layout/index.ts
export { NavigationHeader } from './NavigationHeader'
export { DashboardHeader } from './DashboardHeader'
export { RestaurantDrawer } from './RestaurantDrawer'

// Usage (cleaner)
import { NavigationHeader, DashboardHeader, RestaurantDrawer } from '@/components/layout'
```

**Safety Checks:**
- [ ] All components exported
- [ ] Re-exports match original exports (named vs default)
- [ ] Types re-exported if needed
- [ ] Existing imports still work (backwards compatible)

### Splitting Large Components

**When to Use:** Components over 300-500 lines

**Pattern:**
```typescript
// BEFORE: One large file
// NavigationHeader.tsx (500 lines)
// - Desktop nav (100 lines)
// - Mobile nav (150 lines)
// - Config (100 lines)
// - Main component (150 lines)

// AFTER: Split into logical units
// nav-config.ts - Configuration and types
// NavDesktop.tsx - Desktop navigation
// NavMobile.tsx - Mobile drawer
// NavigationHeader.tsx - Main wrapper (imports others)
```

**Safety Checks:**
- [ ] Props passed correctly between components
- [ ] State lifted appropriately
- [ ] Event handlers work as before
- [ ] Styling unchanged (same classes)
- [ ] Responsive behavior preserved

### Removing Unused Code

**When to Use:** Dead code identified by ESLint or manual review

**Pattern:**
```typescript
// BEFORE
import { Check, X, Plus, Minus, ArrowRight } from 'lucide-react'  // 5 icons
// Only Check and X are used

// AFTER
import { Check, X } from 'lucide-react'  // Only used icons
```

**Safety Checks:**
- [ ] Verify icon/component truly unused (Grep the codebase)
- [ ] Check for dynamic usage (template literals, object access)
- [ ] Look for conditional rendering

### Fixing Dependency Warnings

**When to Use:** React hooks with missing dependencies

**Pattern:**
```typescript
// BEFORE
const fetchData = async () => {
  if (!currentRestaurant) return
  // ...fetch
}

useEffect(() => {
  fetchData()
}, [])  // Missing dependency warning

// AFTER
const fetchData = useCallback(async () => {
  if (!currentRestaurant) return
  // ...fetch
}, [currentRestaurant])  // Dependency in useCallback

useEffect(() => {
  fetchData()
}, [fetchData])  // Now properly tracked
```

**Safety Checks:**
- [ ] Function still executes at correct times
- [ ] No infinite loops created
- [ ] Performance not degraded (unnecessary re-renders)

## Dangerous Patterns to Avoid

### Changing Function Signatures

❌ **Don't Change API:**
```typescript
// Original
const handleEdit = (productionId: string) => { ... }

// Don't change to
const handleEdit = (production: Production) => { ... }
```

**Why:** Breaks all call sites

✅ **Safe Alternative:**
```typescript
// Add optional parameter, keep original working
const handleEdit = (productionId: string, production?: Production) => { ... }
```

### Renaming Exports

❌ **Don't Rename Without Alias:**
```typescript
// Original
export const navigationItems = [...]

// Don't just rename to
export const navItems = [...]
```

**Why:** Breaks all import sites

✅ **Safe Alternative:**
```typescript
// Keep original, add alias
export const navItems = [...]
export const navigationItems = navItems  // Backwards compat
```

### Changing Type Structures

❌ **Don't Restructure Types:**
```typescript
// Original
interface Room {
  _count: { studentAssignments: number }
}

// Don't change to
interface Room {
  assignmentCount: number
}
```

**Why:** Breaks all code using the type

✅ **Safe Alternative:**
```typescript
// Add computed property, keep original
interface Room {
  _count: { studentAssignments: number }
  // Add helper getter if needed elsewhere
}
```

### Modifying Shared Utilities

❌ **Don't Change Utility Behavior:**
```typescript
// Original
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} GNF`
}

// Don't change to
export function formatCurrency(amount: number): string {
  return `GNF ${amount.toLocaleString()}`  // Changed format!
}
```

**Why:** Affects every place currency is displayed

## Verification Steps

### Before Refactoring

1. **Understand Current State**
   ```bash
   npm run build  # Verify build passes
   npm run lint   # Note current warning count
   ```

2. **Document What Exists**
   - List all exports from file
   - Note all import sites
   - Identify all call sites for functions

3. **Create Checkpoint**
   ```bash
   git add -A && git stash  # Save current work
   # or
   git commit -m "wip: before refactoring"
   ```

### During Refactoring

1. **Make One Change at a Time**
   - Extract config → verify
   - Create barrel → verify
   - Remove unused → verify

2. **Verify After Each Change**
   ```bash
   npm run typecheck  # Quick type check
   ```

3. **Keep Original Working**
   - Don't delete until new version works
   - Use aliases for renamed exports

### After Refactoring

1. **Full Verification**
   ```bash
   npm run lint && npm run typecheck && npm run build
   ```

2. **Visual Verification**
   - Load affected pages
   - Check console for errors
   - Verify functionality works

3. **Diff Review**
   ```bash
   git diff --stat  # Review scope of changes
   git diff         # Review actual changes
   ```

## Refactoring Checklist

### Pre-Refactoring
- [ ] Build passes before starting
- [ ] Understand all usages of code being changed
- [ ] Have a rollback plan (stash or commit)

### During Refactoring
- [ ] Making small, incremental changes
- [ ] Verifying after each step
- [ ] Preserving all exports
- [ ] Not changing function signatures
- [ ] Not changing type structures

### Post-Refactoring
- [ ] `npm run lint` - No new warnings
- [ ] `npm run typecheck` - No type errors
- [ ] `npm run build` - Compiles successfully
- [ ] Visual check of affected pages
- [ ] No console errors
- [ ] Functionality unchanged

## Recovery Strategies

### If Build Breaks

```bash
# Quick recovery
git checkout -- path/to/broken/file

# Full recovery
git stash  # or git reset --hard
```

### If Runtime Breaks

1. Check browser console for errors
2. Identify which change caused the issue
3. Revert that specific change
4. Re-verify before proceeding

### If Tests Fail

1. Read test failure message
2. Identify expected vs actual behavior
3. Determine if test or code is wrong
4. Fix appropriately

## Remember

Refactoring is about **improving structure without changing behavior**:

- Same inputs → Same outputs
- Same user experience
- Same functionality
- Better code organization

If users notice any change, it's not refactoring - it's a breaking change.
