# O'Takos Design System Skill

> **Use For**: Creating professional UI components with the gold theme design system

## Quick Reference

### Brand Colors
- Primary Gold: `#D4AF37` (gold-500)
- Gold hover: `gold-600` (#c09a2f)

### Key Patterns

**Card**:
```tsx
className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
```

**Primary Button**:
```tsx
className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors font-medium"
```

**Input**:
```tsx
className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 dark:bg-gray-700 dark:text-white"
```

**Status Badges**:
- Approved: `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`
- Pending: `bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`
- Rejected: `bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`

### Dark Mode
Always pair light/dark classes:
```tsx
"bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
```

See full design system: `docs/bakery-app-reference/02-FRONTEND-DESIGN-SKILL.md`
