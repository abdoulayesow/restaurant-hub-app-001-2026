# Code Organization Guidelines

## Overview

These guidelines establish patterns for organizing code in a maintainable, scalable way. The goal is consistent structure that's easy to navigate and modify.

## Core Principles

1. **Colocation** - Keep related code together
2. **Single Responsibility** - Each file has one clear purpose
3. **Consistent Structure** - Same patterns across the codebase
4. **Discoverability** - Easy to find what you're looking for
5. **Minimal Coupling** - Changes don't ripple unnecessarily

## Barrel Exports Pattern

### What Are Barrel Exports?

A barrel is an `index.ts` file that re-exports from multiple files in a directory.

```typescript
// components/layout/index.ts
export { NavigationHeader } from './NavigationHeader'
export { DashboardHeader } from './DashboardHeader'
export { RestaurantDrawer } from './RestaurantDrawer'
export { NavPill } from './NavPill'
export { navigationItems, routeToSubItem } from './nav-config'
export type { NavSubItem, NavItemConfig } from './nav-config'
```

### Benefits

1. **Cleaner Imports**
   ```typescript
   // Before: Multiple imports
   import { NavigationHeader } from '@/components/layout/NavigationHeader'
   import { DashboardHeader } from '@/components/layout/DashboardHeader'

   // After: Single import
   import { NavigationHeader, DashboardHeader } from '@/components/layout'
   ```

2. **Encapsulation** - Internal structure can change without breaking imports

3. **Discoverability** - One place to see all public exports

### When to Create Barrels

✅ **Do Create For:**
- Component directories with 3+ frequently used components
- Utility directories with multiple helper functions
- Type directories with shared interfaces

❌ **Don't Create For:**
- Directories with 1-2 files
- Internal/private modules
- Auto-generated code

### Barrel Export Best Practices

```typescript
// components/sales/index.ts

// 1. Export components (named exports)
export { SalesTable } from './SalesTable'
export { SalesForm } from './SalesForm'
export { SalesDetailModal } from './SalesDetailModal'

// 2. Export types (with 'type' keyword for clarity)
export type { Sale, SaleItem, SaleStatus } from './types'

// 3. Export utilities if public
export { formatSaleAmount, calculateTotal } from './utils'

// 4. Don't export internal helpers
// ❌ export { internalHelper } from './internal'
```

### Project Barrel Structure

```
components/
├── layout/
│   ├── index.ts          # Barrel for layout components
│   ├── NavigationHeader.tsx
│   ├── DashboardHeader.tsx
│   └── nav-config.ts
├── sales/
│   ├── index.ts          # Barrel for sales components
│   ├── SalesTable.tsx
│   └── SalesForm.tsx
└── admin/
    ├── index.ts          # Barrel for admin components
    ├── ReferenceDataTable.tsx
    └── CategoryManager.tsx
```

## Component Splitting Pattern

### When to Split Components

Split when a component:
- Exceeds 300-500 lines
- Has distinct logical sections
- Contains reusable sub-components
- Mixes configuration with rendering

### Splitting Strategy

**Before (500+ line component):**
```typescript
// NavigationHeader.tsx
const navigationItems = [...]  // 50 lines of config
const NavDesktop = () => {...}  // 100 lines
const NavMobile = () => {...}   // 150 lines
export function NavigationHeader() {...}  // 200 lines
```

**After (organized structure):**
```
components/layout/
├── index.ts              # Barrel exports
├── NavigationHeader.tsx  # Main component (100 lines)
├── NavDesktop.tsx        # Desktop nav (100 lines)
├── NavMobile.tsx         # Mobile nav (150 lines)
└── nav-config.ts         # Config and types (50 lines)
```

### Configuration Extraction

**Extract static configuration to separate files:**

```typescript
// nav-config.ts
import { Home, DollarSign, Package } from 'lucide-react'

export interface NavItemConfig {
  name: string
  href: string
  icon: LucideIcon
  subItems?: NavSubItem[]
}

export const navigationItems: NavItemConfig[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    subItems: [...]
  },
  // ...more items
]

// Lookup map for route → sub-item
export const routeToSubItem: Record<string, string> = {
  '/dashboard/settings': 'Settings',
  '/finances/bank': 'Bank',
}
```

**Benefits:**
- Main component is cleaner
- Config is easy to modify
- Types are reusable
- Testing is simpler

### Sub-Component Extraction

**Extract repeated or complex JSX:**

```typescript
// BEFORE: Inline complex JSX
{items.map(item => (
  <div className="...">
    <Icon className="..." />
    <span>{item.name}</span>
    {item.badge && <Badge>{item.badge}</Badge>}
    {item.subItems && (
      <div className="...">
        {item.subItems.map(sub => (...))}
      </div>
    )}
  </div>
))}

// AFTER: Extract to component
{items.map(item => (
  <NavItem key={item.href} item={item} />
))}
```

## File Naming Conventions

### Components

```
ComponentName.tsx       # React component
ComponentName.test.tsx  # Component tests
ComponentName.module.css # Component styles (if using CSS modules)
```

### Utilities

```
utils.ts               # General utilities
formatters.ts          # Formatting functions
validators.ts          # Validation functions
constants.ts           # Constant values
```

### Types

```
types.ts               # Type definitions
interfaces.ts          # Interface definitions (or combine with types.ts)
```

### Configuration

```
config.ts              # Configuration objects
nav-config.ts          # Navigation-specific config
routes.ts              # Route definitions
```

## Directory Structure Patterns

### Feature-Based Organization

Group by feature, not by type:

```
app/
├── finances/
│   ├── bank/
│   │   └── page.tsx
│   ├── sales/
│   │   └── page.tsx
│   └── expenses/
│       └── page.tsx
└── baking/
    ├── inventory/
    │   └── page.tsx
    └── production/
        └── page.tsx
```

### Component Directory Organization

```
components/
├── layout/           # App-wide layout components
├── ui/               # Generic UI components (Button, Input, Modal)
├── sales/            # Sales-specific components
├── inventory/        # Inventory-specific components
└── shared/           # Shared across features
```

### API Route Organization

```
app/api/
├── auth/             # Authentication endpoints
├── sales/            # Sales CRUD
│   ├── route.ts      # GET /api/sales, POST /api/sales
│   └── [id]/
│       └── route.ts  # GET/PATCH/DELETE /api/sales/[id]
└── inventory/        # Inventory CRUD
    └── route.ts
```

## Import Organization

### Import Order

```typescript
// 1. React and framework imports
import { useState, useEffect, useCallback } from 'react'
import { NextRequest, NextResponse } from 'next/server'

// 2. Third-party libraries
import { format } from 'date-fns'
import { ChevronDown, Home } from 'lucide-react'

// 3. Internal absolute imports (@/)
import { prisma } from '@/lib/prisma'
import { useLocale } from '@/components/providers/LocaleProvider'

// 4. Internal relative imports (./)
import { navigationItems } from './nav-config'
import type { NavItemConfig } from './types'

// 5. Type imports (at end of each section or grouped)
import type { Session } from 'next-auth'
```

### Grouping Related Imports

```typescript
// Group related items from same source
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'

import {
  Home,
  DollarSign,
  Package,
  Settings,
  ChevronDown,
} from 'lucide-react'
```

## Code Colocation Rules

### Keep Together

- Component + its types
- Component + its styles
- Component + its tests
- Feature page + feature components

### Keep Separate

- Configuration from components
- Types shared across features → shared types file
- Utilities used everywhere → lib/ or utils/

## Refactoring Triggers

### When to Reorganize

1. **File Too Long** (>500 lines)
   → Split into logical sub-files

2. **Directory Too Flat** (>10 files)
   → Create subdirectories by feature

3. **Repeated Imports** (same 5 imports everywhere)
   → Create barrel export

4. **Config Mixed with Code**
   → Extract to separate config file

5. **Types Duplicated**
   → Create shared types file

### Reorganization Checklist

- [ ] Plan new structure before moving files
- [ ] Update all imports
- [ ] Create barrel exports for new directories
- [ ] Verify build passes
- [ ] Update any documentation

## Anti-Patterns to Avoid

### Deep Nesting

❌ **Avoid:**
```
components/features/sales/forms/inputs/currency/CurrencyInput.tsx
```

✅ **Better:**
```
components/sales/CurrencyInput.tsx
```

### Circular Dependencies

❌ **Avoid:**
```typescript
// a.ts imports from b.ts
// b.ts imports from a.ts
```

✅ **Better:**
```typescript
// Extract shared code to c.ts
// a.ts imports from c.ts
// b.ts imports from c.ts
```

### Over-Abstraction

❌ **Avoid:**
```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.types.ts
│   ├── Button.styles.ts
│   ├── Button.utils.ts
│   ├── Button.test.ts
│   └── index.ts
```

✅ **Better (for simple components):**
```
components/ui/Button.tsx  # All in one file if <200 lines
```

## Remember

Code organization is about **reducing cognitive load**:

- Easy to find files
- Easy to understand structure
- Easy to make changes
- Easy to onboard new developers

Organize for the humans who will maintain the code, not for abstract purity.
