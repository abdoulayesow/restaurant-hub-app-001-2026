# O'Takos Design System - Frontend Design Skill

> **Skill Type**: UI/UX Design Pattern
> **Based On**: O'Takos Restaurant Dashboard
> **Use For**: Creating professional, modern web applications with beautiful dashboards
> **Copy this file to**: `.claude/skills/otakos-design-system.skill` in your new project

---

## Purpose

This skill teaches Claude to create UI components that match the O'Takos Restaurant Dashboard visual style. When invoked, Claude will generate code that follows these exact patterns, colors, and component structures.

---

## Design Philosophy

1. **Premium Feel**: Gold accents on dark/light backgrounds
2. **Clean & Minimal**: Focused on content, not clutter
3. **Fully Responsive**: Mobile-first approach
4. **Dark Mode Native**: Both themes equally polished
5. **Smooth Interactions**: Subtle animations throughout

---

## Color System

### Brand Colors (Gold Theme)

```typescript
// tailwind.config.ts
const colors = {
  // Primary Brand Color - Gold
  gold: {
    50: '#fdfaf3',   // Lightest - subtle backgrounds
    100: '#faf5e6',  // Light backgrounds
    200: '#f3e6c0',  // Hover states light
    300: '#ecd799',  // Borders light
    400: '#e5c873',  // Icons, accents
    500: '#D4AF37', // PRIMARY - main brand color
    600: '#c09a2f',  // Buttons, links
    700: '#a08527',  // Hover states
    800: '#80701f',  // Dark text accents
    900: '#605b17',  // Darkest
  },

  // Dark Mode Palette
  dark: {
    50: '#f7f7f7',
    100: '#e3e3e3',
    200: '#c8c8c8',
    300: '#a4a4a4',
    400: '#818181',
    500: '#666666',
    600: '#515151',
    700: '#434343',
    800: '#383838',
    900: '#1a1a1a',
    950: '#0a0a0a',  // Darkest - page background
  }
}
```

### Color Usage Rules

| Use Case | Light Mode | Dark Mode |
|----------|------------|-----------|
| Page background | `bg-gray-50` | `dark:bg-gray-950` |
| Card background | `bg-white` | `dark:bg-gray-800` |
| Primary text | `text-gray-900` | `dark:text-white` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Borders | `border-gray-200` | `dark:border-gray-700` |
| Primary button | `bg-gold-600` | Same |
| Primary hover | `hover:bg-gold-700` | Same |
| Gold accent text | `text-gold-600` | `dark:text-gold-400` |

### Semantic Colors

```css
/* Success (profits, approved) */
--success: #10b981;  /* green-500 */
--success-bg: bg-green-100 dark:bg-green-900/30

/* Warning (pending, alerts) */
--warning: #f59e0b;  /* amber-500 */
--warning-bg: bg-yellow-100 dark:bg-yellow-900/30

/* Danger (errors, rejected, delete) */
--danger: #ef4444;   /* red-500 */
--danger-bg: bg-red-100 dark:bg-red-900/30

/* Info (neutral) */
--info: #3b82f6;     /* blue-500 */
--info-bg: bg-blue-100 dark:bg-blue-900/30
```

---

## Typography

### Font Families

```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],      // Body text
  display: ['Playfair Display', 'serif'],          // Headings (optional)
}
```

### Type Scale

```tsx
// Page title
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">

// Section title
<h2 className="text-2xl font-semibold text-gray-900 dark:text-white">

// Card title
<h3 className="text-lg font-semibold text-gray-900 dark:text-white">

// Body text
<p className="text-base text-gray-900 dark:text-white">

// Secondary text
<p className="text-sm text-gray-600 dark:text-gray-400">

// Caption text
<p className="text-xs text-gray-500 dark:text-gray-500">

// Stat numbers (large)
<span className="text-3xl font-bold text-gray-900 dark:text-white">

// Gold highlight
<span className="text-gold-600 dark:text-gold-400 font-semibold">
```

---

## Layout Patterns

### Page Container

```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-950">
  {/* Sticky Header */}
  <DashboardHeader />

  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page Title Section */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Page Title
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Description text
        </p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700">
        <Plus className="w-5 h-5" />
        Add New
      </button>
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Cards */}
    </div>
  </main>
</div>
```

### Grid Systems

```tsx
// 4-column stats grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"

// 3-column content grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// 2-column layout
className="grid grid-cols-1 lg:grid-cols-2 gap-6"

// Auto-fit fluid columns
className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
```

---

## Component Patterns

### Standard Card

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
    Card Title
  </h3>
  {/* Content */}
</div>
```

### Stat Card (KPI)

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  {/* Icon + Label */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-gold-100 dark:bg-gold-900/20 rounded-lg">
        <TrendingUp className="w-6 h-6 text-gold-600 dark:text-gold-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Total Revenue
      </h3>
    </div>
  </div>

  {/* Value */}
  <p className="text-3xl font-bold text-gray-900 dark:text-white">
    $52,340
  </p>

  {/* Change indicator */}
  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
    +12.5% from last month
  </p>
</div>
```

### Gold Highlighted Card

```tsx
<div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg shadow-gold p-6 text-white">
  <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
  <p className="text-gold-100">Special content here</p>
</div>
```

### Chart Card

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      Revenue Overview
    </h3>
    <select className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
      <option>Last 7 days</option>
      <option>Last 30 days</option>
    </select>
  </div>
  <div className="h-80">
    {/* Chart component */}
  </div>
</div>
```

---

## Button Styles

### Primary Button

```tsx
<button className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors font-medium shadow-sm">
  Primary Action
</button>
```

### Secondary Button

```tsx
<button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
  Secondary
</button>
```

### Danger Button

```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
  Delete
</button>
```

### Icon Button

```tsx
<button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
</button>
```

### Button with Icon

```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors">
  <Plus className="w-5 h-5" />
  Add New
</button>
```

---

## Form Elements

### Input Field

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white transition-colors"
    placeholder="Enter value..."
  />
</div>
```

### Select Dropdown

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Category
  </label>
  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white">
    <option>Select category...</option>
    <option>Food</option>
    <option>Utilities</option>
  </select>
</div>
```

### Textarea

```tsx
<textarea
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 dark:bg-gray-700 dark:text-white resize-none"
  rows={4}
  placeholder="Enter description..."
/>
```

---

## Table Design

### Responsive Table

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-900">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Amount
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
            Item Name
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
            $1,234
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
            <button className="text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 font-medium">
              Edit
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Status Badges

```tsx
// Approved / Success / Active
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
  Approved
</span>

// Pending / Warning
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
  Pending
</span>

// Rejected / Error
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
  Rejected
</span>

// Info / Neutral
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
  Info
</span>

// Gold / Premium
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-400">
  Premium
</span>
```

---

## Modal Dialog

```tsx
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
    />

    {/* Modal */}
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Modal Title
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Form content */}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
          Cancel
        </button>
        <button className="px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700">
          Save
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Navigation Header

### Basic Navigation Header

```tsx
<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="flex items-center space-x-4">
        <Image src="/logo.png" alt="Logo" width={40} height={40} />
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            App Name
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dashboard
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center space-x-6">
        <Link
          href="/dashboard"
          className="font-semibold text-sm text-gold-600 dark:text-gold-400"
        >
          Dashboard
        </Link>
        <Link
          href="/sales"
          className="font-semibold text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Sales
        </Link>
      </nav>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme toggle */}
        <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <Sun className="w-5 h-5 text-gold-500" />
        </button>

        {/* User menu */}
        <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <User className="w-4 h-4" />
          <span className="text-sm">John Doe</span>
        </button>
      </div>
    </div>
  </div>
</header>
```

### Navigation Pills (Equal Width)

For pill-style navigation buttons with consistent sizing:

```tsx
// Navigation container
<nav className="hidden lg:flex items-center gap-2">
  {navItems.map(item => (
    <button
      key={item.id}
      className="
        flex items-center justify-center gap-2
        min-w-[130px] px-4 py-2.5 rounded-full
        font-medium text-sm tracking-wide
        bg-gray-100 dark:bg-gray-800
        text-gray-900 dark:text-gray-100
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-300 ease-out
      "
    >
      <Icon className="w-4 h-4" strokeWidth={2.5} />
      <span>{item.label}</span>
      <ChevronDown className="w-3.5 h-3.5" />
    </button>
  ))}
</nav>
```

**Key Pattern:** Use `min-w-[Xpx]` + `justify-center` to ensure all nav buttons have the same width regardless of text length. Calculate minimum width based on the longest label in all supported locales.

---

## Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
    <Package className="w-8 h-8 text-gray-400 dark:text-gray-600" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
    No items found
  </h3>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
    Get started by creating your first item.
  </p>
  <button className="flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700">
    <Plus className="w-5 h-5" />
    Create First Item
  </button>
</div>
```

---

## Loading States

### Skeleton Card

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
</div>
```

### Spinner

```tsx
<div className="flex items-center justify-center py-12">
  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-gold-600"></div>
</div>
```

---

## Chart Styling (Recharts)

### Area Chart with Gold Gradient

```tsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
  <XAxis
    dataKey="date"
    stroke="#888"
    fontSize={12}
    tickLine={false}
    axisLine={false}
  />
  <YAxis
    stroke="#888"
    fontSize={12}
    tickLine={false}
    axisLine={false}
  />
  <Tooltip
    contentStyle={{
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid #D4AF37',
      borderRadius: '8px',
    }}
  />
  <Area
    type="monotone"
    dataKey="revenue"
    stroke="#D4AF37"
    strokeWidth={3}
    fill="url(#colorRevenue)"
  />
</AreaChart>
```

---

## Spacing & Sizing

### Border Radius

```css
rounded:       4px   /* Buttons, badges */
rounded-lg:    8px   /* Cards, inputs */
rounded-xl:    12px  /* Modals */
rounded-full:  9999px /* Pills, avatars */
```

### Shadows

```css
shadow-sm:     0 1px 2px rgba(0,0,0,0.05)     /* Cards */
shadow:        0 1px 3px rgba(0,0,0,0.1)      /* Elevated */
shadow-lg:     0 10px 15px rgba(0,0,0,0.1)    /* Modals */
shadow-gold:   0 4px 14px rgba(212,175,55,0.2) /* Gold accent */
shadow-gold-lg: 0 10px 40px rgba(212,175,55,0.3)
```

### Spacing Scale

```css
p-2:  8px    /* Tight */
p-4:  16px   /* Small */
p-6:  24px   /* Card padding */
p-8:  32px   /* Large */

gap-4: 16px  /* Normal */
gap-6: 24px  /* Comfortable */
```

---

## Mobile Responsive Patterns

### Responsive Grid

```tsx
className="
  grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2     // Small: 2 columns
  lg:grid-cols-3     // Desktop: 3 columns
  xl:grid-cols-4     // Large: 4 columns
"
```

### Responsive Typography

```tsx
className="
  text-xl            // Mobile
  sm:text-2xl        // Small
  lg:text-3xl        // Desktop
"
```

### Responsive Padding

```tsx
className="
  px-4               // Mobile: 16px
  sm:px-6            // Small: 24px
  lg:px-8            // Large: 32px
"
```

---

## Dark Mode Best Practices

### Always Pair Light/Dark

```tsx
// CORRECT - always provide dark mode variant
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"

// INCORRECT - missing dark mode
className="bg-white text-gray-900"
```

### Adjust Brightness for Dark Mode

```tsx
// Primary colors - lighter in dark mode
"text-gold-600 dark:text-gold-400"

// Borders - visible in dark mode
"border-gray-200 dark:border-gray-700"

// Backgrounds - proper depth
"bg-gray-50 dark:bg-gray-900"       // Page
"bg-white dark:bg-gray-800"         // Card
"bg-gray-100 dark:bg-gray-700"      // Elevated
```

---

## Global CSS

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

::-webkit-scrollbar-thumb {
  @apply bg-gold-400 dark:bg-gold-600 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gold-500;
}

/* Smooth transitions */
* {
  @apply transition-colors duration-200;
}
```

---

## Tailwind Config

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfaf3',
          100: '#faf5e6',
          200: '#f3e6c0',
          300: '#ecd799',
          400: '#e5c873',
          500: '#D4AF37',
          600: '#c09a2f',
          700: '#a08527',
          800: '#80701f',
          900: '#605b17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #ecd799 100%)',
      },
      boxShadow: {
        'gold': '0 4px 14px 0 rgba(212, 175, 55, 0.2)',
        'gold-lg': '0 10px 40px 0 rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Quick Reference

### Common Class Combinations

```tsx
// Card
"bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"

// Primary button
"px-4 py-2 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors font-medium"

// Input
"w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gold-500 dark:bg-gray-700 dark:text-white"

// Page title
"text-3xl font-bold text-gray-900 dark:text-white"

// Secondary text
"text-sm text-gray-600 dark:text-gray-400"

// Link (gold)
"text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300 font-medium"
```

---

**Use this skill when building applications that need the same premium, professional look as the O'Takos Dashboard.**
