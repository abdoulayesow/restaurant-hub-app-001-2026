# Build Verification Guidelines

## Overview

These guidelines ensure changes don't break the build or introduce regressions. The goal is to verify code quality before committing.

## Core Principles

1. **Verify Before Committing** - Always run checks before git commit
2. **Fix Warnings, Not Just Errors** - Warnings become errors in production
3. **Test Incrementally** - Verify after each significant change
4. **Use All Three Checks** - Lint, typecheck, and build together

## Verification Commands

### The Essential Three

Run these in order of speed (fastest first):

```bash
# 1. Linting (~5-10 seconds)
npm run lint

# 2. Type checking (~10-30 seconds)
npm run typecheck

# 3. Full build (~30-120 seconds)
npm run build
```

**Why This Order:**
- Lint catches obvious issues quickly
- Typecheck finds type errors before build
- Build verifies everything compiles and optimizes

### Quick Verification (During Development)

```bash
# Fast check during active development
npm run lint && npm run typecheck
```

**Use When:**
- After fixing ESLint warnings
- After refactoring imports
- Before switching tasks

### Full Verification (Before Commit)

```bash
# Complete verification before committing
npm run lint && npm run typecheck && npm run build
```

**Use When:**
- Before creating a commit
- After significant refactoring
- When changes affect multiple files

## ESLint Warning Categories

### Unused Variables

**Pattern:** `'variable' is defined but never used`

**Fixes:**
```typescript
// Option 1: Remove if truly unused
const usedVar = getData()  // Remove unusedVar

// Option 2: Prefix with underscore for intentionally unused
const [value, _setValue] = useState()  // Unused setter
catch (_err) { /* Error ignored intentionally */ }

// Option 3: Add to function if it's a callback param
const handleClick = (_event) => { ... }  // Required by API but unused
```

### Missing Dependencies in useEffect/useCallback

**Pattern:** `React Hook useEffect has a missing dependency`

**Fixes:**
```typescript
// Option 1: Add to dependency array (preferred)
const fetchData = useCallback(async () => {
  if (!currentRestaurant) return
  // ...fetch logic
}, [currentRestaurant])  // Add missing dep

// Option 2: Move function inside effect
useEffect(() => {
  const fetchData = async () => { ... }
  fetchData()
}, [dependency])

// Option 3: Use ref for values that shouldn't trigger re-run
const callbackRef = useRef(callback)
useEffect(() => { callbackRef.current = callback })
```

### Dependency Array with Object Property

**Pattern:** Using `object?.property` in deps instead of `object`

**Fix:**
```typescript
// BAD: Accessing property in dependency array
useEffect(() => { ... }, [item?.id])

// GOOD: Use the object itself
useEffect(() => { ... }, [item])
```

**Why:** React compares by reference; accessing property can cause stale closures.

### Unused Imports

**Pattern:** `'Component' is defined but never used`

**Fix:** Remove the unused import entirely.

```typescript
// BAD: Importing unused icons
import { Check, X, Plus, Minus, ArrowRight } from 'lucide-react'

// GOOD: Only import what's used
import { Check, X } from 'lucide-react'
```

### Using `any` Type

**Pattern:** `Unexpected any. Specify a more specific type`

**Fixes:**
```typescript
// Option 1: Use specific interface
interface UpdateData {
  name?: string
  status?: Status
}
const updateData: UpdateData = {}

// Option 2: Use Record for dynamic keys
const updateData: Record<string, unknown> = {}

// Option 3: Disable for complex cases (Prisma JSON fields)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateData: Record<string, any> = {}
```

### img vs Image Component

**Pattern:** `Using <img> could result in slower LCP`

**Fix:**
```typescript
// BAD: HTML img tag
<img src={user.image} alt={user.name} className="w-10 h-10 rounded-full" />

// GOOD: Next.js Image component
import Image from 'next/image'

<Image
  src={user.image}
  alt={user.name}
  width={40}
  height={40}
  className="w-10 h-10 rounded-full"
/>
```

**Note:** Requires image domain in `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'example.com', pathname: '/**' }
  ]
}
```

## TypeScript Error Categories

### Property Does Not Exist

**Prevention:**
1. Read type definitions before using
2. Check existing usage in codebase
3. Use IDE autocomplete

**Fix:**
```typescript
// Check actual type structure
// BAD: session.userId
// GOOD: session.user.id (after verifying NextAuth session type)
```

### Type Mismatch

**Prevention:**
1. Read interface definitions
2. Match existing patterns
3. Use type assertions sparingly

### Missing Properties

**Prevention:**
1. Check required vs optional fields
2. Use spread operator for full objects
3. Provide defaults for optional fields

## Build Error Categories

### Module Not Found

**Causes:**
- Wrong import path
- Missing dependency
- Case sensitivity issues

**Fix:**
```bash
# Verify file exists
ls -la path/to/file.ts

# Check import paths in similar files
grep -r "from '@/lib/auth'" app/api/
```

### Export Not Found

**Causes:**
- Named vs default export mismatch
- Export was removed/renamed

**Fix:**
```typescript
// Check the source file's exports
// Then match import style:
import { namedExport } from './module'  // Named
import defaultExport from './module'     // Default
```

## Verification Workflow

### After Each File Edit

```
1. Save file
2. Check for IDE errors (red squiggles)
3. Fix any immediate issues
```

### After Multiple Edits

```
1. Run: npm run lint
2. Fix any warnings
3. Run: npm run typecheck
4. Fix any type errors
```

### Before Commit

```
1. Run: npm run lint && npm run typecheck && npm run build
2. Verify: "✓ Compiled successfully"
3. Verify: "No ESLint warnings or errors"
4. Create commit
```

### After Refactoring

```
1. Run all three checks
2. Manually verify affected pages load
3. Check browser console for runtime errors
4. Test key user flows
```

## Common Pitfalls

### Fixing One Warning Creates Another

**Example:** Adding to dependency array causes infinite loop

**Prevention:**
- Wrap functions in useCallback before adding to deps
- Use refs for values that shouldn't trigger re-renders

### Build Passes But Runtime Fails

**Example:** Dynamic import path works in dev but not production

**Prevention:**
- Always run full build before committing
- Test production build locally: `npm run build && npm run start`

### ESLint Auto-Fix Breaks Code

**Example:** Auto-removing "unused" variable that's used dynamically

**Prevention:**
- Review auto-fix suggestions before accepting
- Use `// eslint-disable-next-line` for intentional patterns

## Checklist Before Commit

- [ ] `npm run lint` - No warnings or errors
- [ ] `npm run typecheck` - No type errors
- [ ] `npm run build` - Compiles successfully
- [ ] No console errors in browser
- [ ] Key functionality still works
- [ ] Changes match the original intent

## Remember

Build verification is about **confidence**:
- Confidence that code compiles
- Confidence that types are correct
- Confidence that nothing is broken
- Confidence to deploy

Spend the extra minute to verify - it saves hours of debugging in production.
