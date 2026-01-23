# Bliss Patisserie UI Refactoring Plan
**Date Created:** 2026-01-20
**Version:** 1.0
**Status:** Planning Phase

---

## Executive Summary

This document outlines a comprehensive visual refactoring plan to transform the Bakery Hub application from a rustic bakery aesthetic to a **luxury French patisserie** design system aligned with the new **Bliss Patisserie** brand identity.

### Design Philosophy

**From:** Rustic artisan bakery (terracotta, wheat icons, casual warm tones)
**To:** Refined French patisserie (purple elegance, sophisticated script, luxury cream)

**Core Aesthetic Principles:**
- **Refined Minimalism** with purposeful ornamentation
- **French Luxury** through typography and color
- **Controlled Elegance** in spacing and composition
- **Sophisticated Motion** with subtle, meaningful animations

---

## Brand Analysis

### New Bliss Patisserie Logo Elements

**Logo File:** `public/new_logo/bliss-patisserie-logo.svg`

**Key Visual Characteristics:**
1. **Purple Gradient Frames** (#3D1B4D → #5A2D6E) - regal, elegant
2. **Brown Script "Bliss"** (#2C1810) - handwritten luxury
3. **Diagonal Zebra Stripes** - distinctive pattern element
4. **Corner Ornaments** - delicate decorative details
5. **Three Business Lines:** PATISSERIE • BOULANGERIE • CREAMERIE
6. **Sparkle Details** - subtle magical touches

**Typography in Logo:**
- Display: Brush Script MT (cursive, italic)
- Headers: Didot/Bodoni MT (classic serif, wide letter-spacing)
- Body: (To be determined in refactor)

**Color Palette from Logo:**
```
Primary Purple: #3D1B4D (Royal Plum)
Secondary Purple: #5A2D6E (Plum Shadow)
Brown Script: #2C1810 (Deep Espresso)
Warm Brown: #6B5744 (Café)
Cream Background: #FEFEFE (Pure Cream)
Decorative Accent: #9B4D9F (Mauve)
```

---

## Phase 1: Design System Foundation

### 1.1 Typography Overhaul

**Current State:**
```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans');
font-family: 'DM Sans', system-ui, sans-serif;
```

**Target State:**
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap');

/* Typography Hierarchy */
--font-display: 'Playfair Display', serif;        /* Headings, hero text */
--font-elegant: 'Cormorant Garamond', serif;      /* Subheadings, cards */
--font-body: 'Montserrat', sans-serif;            /* Body text, UI */
--font-script: 'Brush Script MT', cursive;        /* Brand moments */
```

**Implementation:**
- [ ] Update `globals.css` with new font imports
- [ ] Create CSS variables for font families
- [ ] Update `tailwind.config.ts` with new font family utilities
- [ ] Add `.bliss-display`, `.bliss-elegant`, `.bliss-body`, `.bliss-script` utility classes

**Files to Update:**
- `app/globals.css` (lines 5-6, 39)
- `tailwind.config.ts` (lines 57-60)

---

### 1.2 Color Palette Migration

**Current Tailwind Config:**
```typescript
// terracotta palette (rustic)
terracotta: {
  500: '#C45C26',  // Primary
  700: '#8B3A14',  // Accent
}
```

**Target Tailwind Config:**
```typescript
// Royal Plum palette (luxury)
plum: {
  50: '#F8F5FA',
  100: '#F0E9F5',
  200: '#E1D4EB',
  300: '#C4A8D6',
  400: '#9B4D9F',
  500: '#5A2D6E',   // Secondary
  600: '#4A2459',
  700: '#3D1B4D',   // Primary
  800: '#2E1439',
  900: '#1F0D26',
},
espresso: {
  50: '#F7F5F4',
  100: '#EBE7E4',
  200: '#D7CFC9',
  300: '#B09A8C',
  400: '#8B7765',
  500: '#6B5744',   // Warm accent
  600: '#564536',
  700: '#2C1810',   // Deep brown
  800: '#1F110B',
  900: '#140A07',
},
cream: {
  50: '#FFFEFE',   // Pure cream
  100: '#FFF8F0',  // Warm cream
  200: '#FFE4C4',  // Peachy cream
  300: '#F5D4A8',
  // ... keep existing
},
mauve: {
  400: '#C48FA5',  // Rose accent
  500: '#9B4D9F',  // Decorative purple
  600: '#8B4D8F',
}
```

**Implementation:**
- [ ] Add new color palettes to `tailwind.config.ts`
- [ ] Keep old `terracotta` palette for gradual migration
- [ ] Update CSS variables in `globals.css` for light/dark modes
- [ ] Create palette switcher for multi-restaurant support

**Files to Update:**
- `tailwind.config.ts` (lines 12-55)
- `app/globals.css` (lines 8-35)

---

### 1.3 Visual Effects & Patterns

**New Design Elements:**

**Diagonal Stripes Pattern** (from logo):
```css
.diagonal-stripes-bliss {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 15px,
    rgba(61, 27, 77, 0.03) 15px,
    rgba(61, 27, 77, 0.03) 30px
  );
}
```

**Ornate Corner Decorations:**
```css
.ornate-corners {
  position: relative;
}
.ornate-corners::before,
.ornate-corners::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1.5px solid currentColor;
  opacity: 0.3;
}
.ornate-corners::before {
  top: 12px;
  left: 12px;
  border-right: none;
  border-bottom: none;
}
.ornate-corners::after {
  bottom: 12px;
  right: 12px;
  border-left: none;
  border-top: none;
}
```

**Shimmer Animation** (luxury effect):
```css
@keyframes shimmer-luxury {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer-luxury {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(155, 77, 159, 0.15) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer-luxury 2.5s infinite;
}
```

**Float Animation** (for logo):
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

**Implementation:**
- [ ] Add new pattern utilities to `globals.css`
- [ ] Replace `.grain-overlay` with `.diagonal-stripes-bliss`
- [ ] Add `.ornate-corners` for cards and modals
- [ ] Update animation keyframes for luxury aesthetic

**Files to Update:**
- `app/globals.css` (lines 71-227)

---

## Phase 2: Core Component Refactoring

### 2.1 Logo Component Replacement

**Current:** `components/brand/Logo.tsx` (375 lines)
- Rustic wheat/bread/croissant icons
- Old terracotta/warmBrown/burntSienna/gold palettes
- SVG-based icon system

**Target:**
- Use new Bliss Patisserie logo from `public/new_logo/`
- Support SVG, PNG, JPG formats
- Add floating animation
- Maintain size variants (large, medium, small)
- Remove old palette system

**New Component Structure:**
```tsx
interface BlissLogoProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'svg' | 'png' | 'jpg'
  animate?: boolean
  className?: string
}

export function BlissLogo({
  size = 'medium',
  variant = 'svg',
  animate = false,
  className
}: BlissLogoProps) {
  // Size mapping (maintain minimum 120px)
  const sizes = {
    small: { width: 120, height: 90 },
    medium: { width: 200, height: 150 },
    large: { width: 400, height: 300 },
  }

  const logoSrc = `/new_logo/bliss-patisserie-logo.${variant}`

  return (
    <div className={cn(
      animate && 'animate-float',
      className
    )}>
      <Image
        src={logoSrc}
        alt="Bliss Patisserie"
        width={sizes[size].width}
        height={sizes[size].height}
        priority
      />
    </div>
  )
}
```

**Implementation:**
- [ ] Create new `components/brand/BlissLogo.tsx`
- [ ] Update all logo imports across the app
- [ ] Remove old `Logo.tsx` color palette logic
- [ ] Add logo size guidelines component

**Files to Update:**
- `components/brand/Logo.tsx` → Replace entirely
- All components importing `Logo` (search with Grep)

---

### 2.2 Navigation Header

**Current:** `components/layout/NavigationHeader.tsx`
- Terracotta color scheme
- DM Sans font
- Standard card shadows

**Target Updates:**
```tsx
// Color scheme
bg-cream-50 dark:bg-dark-900 → bg-cream-50 dark:bg-plum-900
text-terracotta-900 → text-plum-700
border-terracotta-200 → border-plum-200/30

// Typography
font-display → className="bliss-elegant"
Restaurant name → className="bliss-display text-xl"

// Logo integration
<Logo /> → <BlissLogo size="small" animate />

// Decorative element
Add diagonal-stripes-bliss to header background
```

**Implementation:**
- [ ] Update color classes
- [ ] Change typography to elegant serif
- [ ] Add diagonal stripes pattern
- [ ] Integrate new BlissLogo component
- [ ] Refine spacing for luxury feel (more generous padding)

**Files to Update:**
- `components/layout/NavigationHeader.tsx`

---

### 2.3 Cards & Containers

**Pattern to Replace:**

**Before:**
```tsx
<div className="bg-cream-100 dark:bg-dark-800 rounded-2xl warm-shadow p-5 grain-overlay">
```

**After:**
```tsx
<div className="bg-cream-50 dark:bg-plum-900 rounded-2xl warm-shadow-lg p-6 diagonal-stripes-bliss ornate-corners border border-plum-200/20 dark:border-plum-700/20">
```

**Typography in Cards:**
```tsx
// Headings
<h3 className="bliss-elegant text-lg text-plum-700 dark:text-cream-100">

// Body text
<p className="bliss-body text-sm text-espresso-600 dark:text-cream-200">

// Accent text
<span className="bliss-script text-mauve-500">
```

**Implementation Strategy:**
- [ ] Create reusable `Card` component with luxury styling
- [ ] Add `CardHeader`, `CardBody`, `CardFooter` subcomponents
- [ ] Search for all card patterns and replace systematically

**Files to Update (Priority Order):**
1. `app/page.tsx` (Dashboard cards)
2. `app/finances/sales/page.tsx` (Summary cards)
3. `app/finances/expenses/page.tsx`
4. `components/inventory/InventoryCard.tsx`
5. `components/baking/*` (all card-based components)

---

### 2.4 Buttons & Interactive Elements

**Current Button Styles:**
```tsx
bg-terracotta-500 hover:bg-terracotta-600
```

**Target Button Variants:**

**Primary (Purple):**
```tsx
bg-plum-700 hover:bg-plum-800 text-cream-50
shadow-lg shadow-plum-900/20
transition-all duration-300
hover:shadow-xl hover:shadow-plum-900/30
hover:-translate-y-0.5
```

**Secondary (Espresso):**
```tsx
bg-espresso-700 hover:bg-espresso-800 text-cream-50
```

**Outline:**
```tsx
border-2 border-plum-600 text-plum-700 hover:bg-plum-50
```

**Ghost:**
```tsx
text-plum-700 hover:bg-plum-50/50
```

**Implementation:**
- [ ] Create `components/ui/Button.tsx` with variants
- [ ] Replace all inline button classes
- [ ] Add micro-interactions (lift on hover)
- [ ] Ensure WCAG AA contrast compliance

**Files to Update:**
- Create: `components/ui/Button.tsx`
- Update: All components with buttons (65+ files)

---

### 2.5 Status Badges

**Current:** Various badge colors (green, amber, red)

**Target Luxury Badges:**
```tsx
// Approved / Success
bg-emerald-50 dark:bg-emerald-950
text-emerald-700 dark:text-emerald-300
border border-emerald-200 dark:border-emerald-800
font-medium tracking-wide

// Pending
bg-mauve-50 dark:bg-mauve-950
text-mauve-700 dark:text-mauve-300
border border-mauve-200

// Rejected / Alert
bg-rose-50 dark:bg-rose-950
text-rose-700 dark:text-rose-300
border border-rose-200
```

**Typography:**
```tsx
className="bliss-body text-xs uppercase tracking-wider"
```

**Implementation:**
- [ ] Update `components/ui/StatusBadge.tsx`
- [ ] Update `components/sales/SaleStatusBadge.tsx`
- [ ] Update `components/inventory/StockStatusBadge.tsx`
- [ ] Ensure badge pill shape with proper padding

---

## Phase 3: Page-Level Refactoring

### 3.1 Dashboard (Home Page)

**File:** `app/page.tsx`

**Key Changes:**
1. **Hero Section:**
   - Large BlissLogo with float animation
   - Elegant welcome message in Playfair Display
   - Diagonal stripes background
   - Ornate corner decorations

2. **Metric Cards:**
   - Replace terracotta with plum/espresso colors
   - Add shimmer effect on hover
   - Use Cormorant Garamond for numbers
   - Ornate corners on each card

3. **Charts:**
   - Update Recharts colors to plum/espresso palette
   - Elegant axis labels with Montserrat
   - Subtle grid lines

**Implementation:**
- [ ] Refactor header section
- [ ] Update all metric cards
- [ ] Customize chart colors
- [ ] Add page-load stagger animation

---

### 3.2 Sales Page

**File:** `app/finances/sales/page.tsx`

**Current Issues:** Recently fixed (circular dependency)

**Refactoring Focus:**
1. Summary cards (lines 288-398)
2. Charts section (lines 400-427)
3. Filters (lines 429-459)
4. Table component

**Updates:**
```tsx
// Today's Sales card icon
<TrendingUp className="text-emerald-600" />
→ <TrendingUp className="text-plum-600 dark:text-plum-400" />

// Revenue card
bg-cream-100 → bg-cream-50 diagonal-stripes-bliss ornate-corners

// Typography
text-terracotta-900 → text-plum-800 dark:text-cream-100
className="text-2xl font-bold" → className="text-2xl bliss-elegant font-semibold"
```

**Implementation:**
- [ ] Update summary cards styling
- [ ] Refactor chart colors (SalesTrendChart, PaymentMethodChart)
- [ ] Update search input and filter dropdown
- [ ] Apply luxury styling to SalesTable

**Files to Update:**
- `app/finances/sales/page.tsx` (lines 288-496)
- `components/sales/SalesTrendChart.tsx`
- `components/sales/PaymentMethodChart.tsx`
- `components/sales/SalesTable.tsx`

---

### 3.3 Expenses Page

**File:** `app/finances/expenses/page.tsx`

**Similar Refactoring as Sales Page:**
- [ ] Summary cards
- [ ] Chart components (ExpenseTrendChart, ExpenseCategoryChart)
- [ ] Table styling
- [ ] Modal components (AddEditExpenseModal)

---

### 3.4 Inventory Pages

**Files:**
- `app/inventory/page.tsx` (List view)
- `app/inventory/[id]/page.tsx` (Detail view)

**Key Components:**
- `components/inventory/InventoryCard.tsx` - Critical
- `components/inventory/InventoryTable.tsx`
- `components/inventory/StockStatusBadge.tsx`
- `components/inventory/CategoryFilter.tsx`

**Updates:**
- [ ] Card grid layout with luxury styling
- [ ] Stock level indicators in plum colors
- [ ] Category badges with elegant fonts
- [ ] Detail view with ornate presentation

---

### 3.5 Baking/Production Pages

**Files:**
- `app/baking/page.tsx`
- `components/baking/BakingDashboard.tsx`
- `components/baking/ProductionReadinessCard.tsx`

**Special Considerations:**
- This is a production-focused feature
- Maintain functional clarity while adding elegance
- Use espresso/warm tones for ingredient readiness
- Plum accents for actionable items

---

## Phase 4: Modal & Form Components

### 4.1 Modal Components

**Pattern to Update:**

**Current:**
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white dark:bg-dark-800 rounded-xl p-6">
```

**Target:**
```tsx
<div className="fixed inset-0 bg-plum-900/60 backdrop-blur-sm flex items-center justify-center">
  <div className="bg-cream-50 dark:bg-plum-900 rounded-2xl p-8 diagonal-stripes-bliss ornate-corners border-2 border-plum-200 dark:border-plum-700 shadow-2xl animate-fade-in-up">
```

**Typography:**
- Modal titles: `bliss-display text-2xl`
- Section headings: `bliss-elegant text-lg`
- Form labels: `bliss-body text-sm`

**Implementation:**
- [ ] Create base `Modal` component
- [ ] Update all modal components (15+ files)
- [ ] Add entrance/exit animations

**Files to Update:**
- `components/inventory/AddEditItemModal.tsx`
- `components/sales/AddEditSaleModal.tsx`
- `components/expenses/AddEditExpenseModal.tsx`
- `components/debts/CreateDebtModal.tsx`
- `components/bank/DepositFormModal.tsx`
- And 10+ more modal components

---

### 4.2 Form Inputs

**Current:**
```tsx
<input className="border border-gray-300 rounded-lg px-3 py-2" />
```

**Target:**
```tsx
<input className="
  border border-plum-200 dark:border-plum-700
  rounded-xl px-4 py-2.5
  bg-cream-50 dark:bg-plum-950
  text-plum-900 dark:text-cream-100
  bliss-body
  focus:ring-2 focus:ring-plum-500 focus:border-plum-500
  transition-all duration-200
  placeholder:text-plum-400 dark:placeholder:text-plum-600
" />
```

**Select Dropdowns:**
```tsx
<select className="... ornate-select">
```

**Textarea:**
```tsx
<textarea className="... diagonal-stripes-bliss">
```

**Implementation:**
- [ ] Create form component library
- [ ] Update all form fields across modals
- [ ] Ensure dark mode compatibility

---

## Phase 5: Charts & Data Visualization

### 5.1 Recharts Color Palette

**Current Recharts Colors:**
```tsx
stroke="#C45C26"  // Terracotta
fill="#E89A71"
```

**Target Luxury Palette:**
```typescript
// Define chart color system
const CHART_COLORS = {
  primary: '#3D1B4D',      // Plum 700
  secondary: '#5A2D6E',    // Plum 500
  tertiary: '#9B4D9F',     // Mauve 500
  accent: '#2C1810',       // Espresso 700
  success: '#059669',      // Emerald 600
  warning: '#D97706',      // Amber 600
  danger: '#DC2626',       // Red 600
  neutral: '#6B5744',      // Espresso 500
}

const GRADIENT_STOPS = {
  purple: ['#3D1B4D', '#5A2D6E', '#9B4D9F'],
  brown: ['#2C1810', '#6B5744', '#8B7765'],
  cream: ['#FEFEFE', '#FFF8F0', '#FFE4C4'],
}
```

**Implementation:**
- [ ] Create `lib/chartColors.ts` with color constants
- [ ] Update all chart components to use new palette
- [ ] Add gradient fills for area charts
- [ ] Customize tooltip styling

**Files to Update:**
- `components/sales/SalesTrendChart.tsx`
- `components/sales/PaymentMethodChart.tsx`
- `components/expenses/ExpenseTrendChart.tsx`
- `components/expenses/ExpenseCategoryChart.tsx`
- `components/dashboard/RevenueChart.tsx`
- `components/dashboard/ExpensesPieChart.tsx`

---

### 5.2 Chart Typography & Grid

**Axis Labels:**
```tsx
<XAxis
  tick={{
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fill: '#6B5744'  // Espresso 500
  }}
/>
```

**Tooltips:**
```tsx
<Tooltip
  contentStyle={{
    backgroundColor: '#FEFEFE',
    border: '2px solid #E1D4EB',
    borderRadius: '12px',
    fontFamily: 'Cormorant Garamond, serif',
    boxShadow: '0 10px 25px rgba(61, 27, 77, 0.15)'
  }}
/>
```

**Grid Lines:**
```tsx
<CartesianGrid
  strokeDasharray="3 3"
  stroke="#E1D4EB"  // Plum 200
  opacity={0.3}
/>
```

---

## Phase 6: Dark Mode Refinement

### 6.1 Dark Mode Color Strategy

**Current Dark Mode:**
```css
.dark {
  --bg-primary: #1A1412;  /* Brown-tinted black */
  --text-primary: #FFF8E7; /* Cream */
}
```

**Target Luxury Dark Mode:**
```css
.dark {
  /* Deep purple-tinted backgrounds */
  --bg-primary: #1F0D26;      /* Plum 900 */
  --bg-secondary: #2E1439;    /* Plum 800 */
  --bg-tertiary: #3D1B4D;     /* Plum 700 */

  /* Cream text for readability */
  --text-primary: #FFFEFE;    /* Cream 50 */
  --text-secondary: #FFF8F0;  /* Cream 100 */
  --text-muted: #D7CFC9;      /* Espresso 200 */

  /* Accent colors */
  --accent: #9B4D9F;          /* Mauve 500 */
  --accent-hover: #C48FA5;    /* Mauve 400 */

  /* Borders and shadows */
  --border: rgba(193, 168, 214, 0.15);  /* Plum 300 @ 15% */
  --shadow: rgba(31, 13, 38, 0.4);      /* Plum 900 @ 40% */
}
```

**Dark Mode Diagonal Stripes:**
```css
.dark .diagonal-stripes-bliss {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 15px,
    rgba(155, 77, 159, 0.08) 15px,  /* Mauve with higher opacity */
    rgba(155, 77, 159, 0.08) 30px
  );
}
```

**Implementation:**
- [ ] Update dark mode CSS variables
- [ ] Test all components in dark mode
- [ ] Ensure WCAG AAA contrast ratios
- [ ] Add dark mode toggle with elegant animation

---

### 6.2 Dark Mode Component Patterns

**Cards:**
```tsx
// Light mode
bg-cream-50 border-plum-200

// Dark mode
dark:bg-plum-900 dark:border-plum-700
```

**Buttons:**
```tsx
// Light mode
bg-plum-700 text-cream-50

// Dark mode (same, already high contrast)
dark:bg-plum-600 dark:text-cream-50
```

**Inputs:**
```tsx
// Light mode
bg-cream-50 border-plum-200 text-plum-900

// Dark mode
dark:bg-plum-950 dark:border-plum-700 dark:text-cream-100
```

---

## Phase 7: Animation & Micro-interactions

### 7.1 Page Load Animations

**Staggered Card Entrance:**
```css
@keyframes bliss-card-entrance {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.bliss-card-stagger-1 {
  animation: bliss-card-entrance 0.5s ease-out 0.1s both;
}
.bliss-card-stagger-2 {
  animation: bliss-card-entrance 0.5s ease-out 0.2s both;
}
.bliss-card-stagger-3 {
  animation: bliss-card-entrance 0.5s ease-out 0.3s both;
}
```

**Logo Float:**
```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
```

**Shimmer Hover:**
```css
.bliss-card:hover {
  animation: shimmer-luxury 2s ease-in-out;
}
```

---

### 7.2 Button Interactions

**Lift on Hover:**
```tsx
<button className="
  transition-all duration-300 ease-out
  hover:-translate-y-1
  hover:shadow-xl hover:shadow-plum-900/30
  active:translate-y-0
">
```

**Ripple Effect (optional):**
```tsx
// Consider adding ripple on click for luxury feel
```

---

### 7.3 Modal Animations

**Entrance:**
```css
@keyframes modal-entrance {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

**Backdrop Fade:**
```css
@keyframes backdrop-fade {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

---

## Phase 8: Multi-Restaurant Palette Support

### 8.1 Palette System Design

**Current System:**
```typescript
// components/brand/Logo.tsx
const colorPalettes = {
  terracotta: { primary: '#C45C26' },
  warmBrown: { primary: '#8B4513' },
  // ...
}
```

**Target System:**
```typescript
// lib/blissPalettes.ts
export const blissPalettes = {
  royalPlum: {
    name: 'Royal Plum',
    primary: '#3D1B4D',
    secondary: '#5A2D6E',
    accent: '#2C1810',
    cream: '#FEFEFE',
    warm: '#6B5744',
    decorative: '#9B4D9F',
  },
  cafeCreme: {
    name: 'Café Crème',
    primary: '#4A3526',
    secondary: '#6B4E3D',
    accent: '#2C1810',
    cream: '#FFF8F0',
    warm: '#8B7355',
    decorative: '#A0826D',
  },
  rosePetal: {
    name: 'Rose Petal',
    primary: '#8B6B7A',
    secondary: '#A68A9F',
    accent: '#5C3D4F',
    cream: '#FFF5F7',
    warm: '#D4A5B8',
    decorative: '#C48FA5',
  },
  pistache: {
    name: 'Pistache',
    primary: '#6B8B6F',
    secondary: '#8FA893',
    accent: '#3D4F3E',
    cream: '#FAFFF5',
    warm: '#A8C4A5',
    decorative: '#9FB89D',
  },
}
```

---

### 8.2 Dynamic Palette Application

**CSS Variable Injection:**
```typescript
// components/providers/RestaurantProvider.tsx
useEffect(() => {
  if (currentRestaurant && currentPalette) {
    const palette = blissPalettes[currentPalette]

    document.documentElement.style.setProperty('--color-primary', palette.primary)
    document.documentElement.style.setProperty('--color-secondary', palette.secondary)
    document.documentElement.style.setProperty('--color-accent', palette.accent)
    document.documentElement.style.setProperty('--color-cream', palette.cream)
    document.documentElement.style.setProperty('--color-warm', palette.warm)
    document.documentElement.style.setProperty('--color-decorative', palette.decorative)
  }
}, [currentRestaurant, currentPalette])
```

**Tailwind Config Extension:**
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      accent: 'var(--color-accent)',
      // ...
    }
  }
}
```

**Implementation:**
- [ ] Create `lib/blissPalettes.ts`
- [ ] Update RestaurantProvider with palette switching
- [ ] Add CSS variable injection
- [ ] Test palette switching without page reload

---

## Phase 9: Accessibility & Performance

### 9.1 Accessibility Checklist

**Typography:**
- [ ] Minimum font size: 14px for body text
- [ ] Line height: 1.5+ for readability
- [ ] Font weight: Ensure thin fonts (300) have sufficient size

**Color Contrast:**
- [ ] AAA compliance for body text (7:1)
- [ ] AA compliance for UI components (4.5:1)
- [ ] Test plum on cream combinations
- [ ] Test dark mode contrast

**Focus States:**
- [ ] Visible focus rings on all interactive elements
- [ ] Custom focus styling with plum colors
- [ ] Skip-to-content links

**Screen Reader Support:**
- [ ] Alt text for all images
- [ ] ARIA labels for icon buttons
- [ ] Semantic HTML structure

**Keyboard Navigation:**
- [ ] Tab order logical
- [ ] Modals trappable
- [ ] Escape key closes modals

---

### 9.2 Performance Optimization

**Font Loading:**
```tsx
// app/layout.tsx
import { Playfair_Display, Cormorant_Garamond, Montserrat } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-playfair'
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-cormorant'
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-montserrat'
})
```

**Image Optimization:**
- [ ] Use Next.js Image for logo
- [ ] Lazy load below-fold images
- [ ] Provide appropriate sizes
- [ ] Consider WebP format

**Animation Performance:**
- [ ] Use `transform` and `opacity` only for animations
- [ ] Avoid animating `width`, `height`, `top`, `left`
- [ ] Add `will-change` sparingly
- [ ] Use CSS animations over JS when possible

**Bundle Size:**
- [ ] Remove old terracotta references after migration
- [ ] Tree-shake unused Recharts components
- [ ] Dynamic import heavy components

---

## Phase 10: Testing & Quality Assurance

### 10.1 Visual Testing

**Browser Support:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Device Testing:**
- [ ] Desktop (1920x1080, 1440x900)
- [ ] Tablet (iPad, 768x1024)
- [ ] Mobile (iPhone 14, 390x844)

**Dark Mode:**
- [ ] Test all components in dark mode
- [ ] Verify smooth theme transitions
- [ ] Check contrast ratios

---

### 10.2 Functional Testing

**Component Testing:**
- [ ] All buttons clickable
- [ ] Forms submittable
- [ ] Modals open/close correctly
- [ ] Dropdowns function
- [ ] Charts render with data

**User Flows:**
- [ ] Login flow
- [ ] Add sale flow
- [ ] Add expense flow
- [ ] Inventory update flow
- [ ] Restaurant switching flow

---

### 10.3 Regression Testing

**After Each Phase:**
- [ ] Run build: `npm run build`
- [ ] Check for TypeScript errors
- [ ] Test existing features still work
- [ ] Verify no broken imports
- [ ] Check bundle size hasn't ballooned

---

## Implementation Timeline

### Week 1: Foundation
- **Days 1-2:** Phase 1 (Design System Foundation)
  - Typography setup
  - Color palette migration
  - CSS utilities and patterns
- **Days 3-5:** Phase 2 (Core Components)
  - Logo component
  - Navigation header
  - Card patterns
  - Buttons

### Week 2: Pages
- **Days 6-8:** Phase 3 (Page Refactoring)
  - Dashboard
  - Sales page
  - Expenses page
- **Days 9-10:** Phase 4 (Modals & Forms)
  - Modal components
  - Form inputs

### Week 3: Data & Interactivity
- **Days 11-13:** Phase 5 (Charts)
  - Recharts color updates
  - Typography and grid customization
- **Days 14-15:** Phase 6 (Dark Mode)
  - Refinement and testing

### Week 4: Polish & Deploy
- **Days 16-17:** Phase 7 (Animations)
  - Page load animations
  - Micro-interactions
- **Day 18:** Phase 8 (Multi-Restaurant Palettes)
- **Days 19-20:** Phase 9 (Accessibility & Performance)
- **Days 21-22:** Phase 10 (Testing & QA)
- **Day 23:** Buffer for fixes
- **Days 24-25:** Production deployment and monitoring

---

## Risk Mitigation

### Critical Risks

**1. Breaking Existing Functionality**
- **Mitigation:** Phase-by-phase approach, test after each change
- **Rollback Plan:** Git branches for each phase

**2. Performance Degradation**
- **Mitigation:** Monitor bundle size, lazy load fonts
- **Benchmark:** Run Lighthouse before/after

**3. Accessibility Regression**
- **Mitigation:** Automated a11y testing with axe-core
- **Manual Testing:** Keyboard navigation testing

**4. Dark Mode Issues**
- **Mitigation:** Test every component in both modes
- **Tool:** Use browser DevTools to toggle rapidly

**5. Color Contrast Failures**
- **Mitigation:** Use WebAIM Contrast Checker throughout
- **Fix:** Adjust plum shades if needed

---

## Success Metrics

### Qualitative
- ✅ Visually distinct from generic bakery apps
- ✅ Luxury French patisserie aesthetic achieved
- ✅ Consistent brand identity across all pages
- ✅ Elegant typography hierarchy
- ✅ Smooth, delightful animations

### Quantitative
- ✅ 100% Lighthouse Accessibility score maintained
- ✅ 90+ Lighthouse Performance score
- ✅ Bundle size increase < 15%
- ✅ 0 TypeScript errors
- ✅ 0 console warnings in production
- ✅ All WCAG AA contrast checks pass

### User-Facing
- ✅ No functional regressions
- ✅ Faster perceived load time (animations hide loading)
- ✅ Improved brand recognition
- ✅ Professional appearance for remote owner

---

## Appendix A: File Change Manifest

### Files to Create (New)
1. `components/brand/BlissLogo.tsx`
2. `components/ui/Button.tsx`
3. `components/ui/Card.tsx`
4. `lib/blissPalettes.ts`
5. `lib/chartColors.ts`

### Files to Modify (High Priority)
1. `app/globals.css` ⭐
2. `tailwind.config.ts` ⭐
3. `app/page.tsx` ⭐
4. `app/finances/sales/page.tsx` ⭐
5. `app/finances/expenses/page.tsx` ⭐
6. `components/layout/NavigationHeader.tsx` ⭐
7. `components/providers/RestaurantProvider.tsx` ⭐

### Files to Modify (Medium Priority)
8. `app/inventory/page.tsx`
9. `app/baking/page.tsx`
10. `components/sales/SalesTrendChart.tsx`
11. `components/sales/PaymentMethodChart.tsx`
12. `components/expenses/ExpenseTrendChart.tsx`
13. `components/expenses/ExpenseCategoryChart.tsx`
14. `components/dashboard/RevenueChart.tsx`
15. `components/ui/StatusBadge.tsx`

### Files to Modify (Lower Priority)
16-65. All remaining modal and form components

### Files to Delete (After Migration)
- `components/brand/Logo.tsx` (old version)
- Old terracotta palette references (after full migration)

---

## Appendix B: Color Palette Reference

### Royal Plum (Default)
```
Primary:    #3D1B4D
Secondary:  #5A2D6E
Accent:     #2C1810
Cream:      #FEFEFE
Warm:       #6B5744
Decorative: #9B4D9F
```

### Café Crème
```
Primary:    #4A3526
Secondary:  #6B4E3D
Accent:     #2C1810
Cream:      #FFF8F0
Warm:       #8B7355
Decorative: #A0826D
```

### Rose Petal
```
Primary:    #8B6B7A
Secondary:  #A68A9F
Accent:     #5C3D4F
Cream:      #FFF5F7
Warm:       #D4A5B8
Decorative: #C48FA5
```

### Pistache
```
Primary:    #6B8B6F
Secondary:  #8FA893
Accent:     #3D4F3E
Cream:      #FAFFF5
Warm:       #A8C4A5
Decorative: #9FB89D
```

---

## Appendix C: Typography Scale

### Playfair Display (Display Font)
```
Hero:        text-6xl (60px)
H1:          text-4xl (36px)
H2:          text-3xl (30px)
H3:          text-2xl (24px)
```

### Cormorant Garamond (Elegant Serif)
```
Subheading:  text-xl (20px)
Card Title:  text-lg (18px)
Large Body:  text-base (16px)
```

### Montserrat (Body Sans)
```
Body:        text-sm (14px)
Caption:     text-xs (12px)
Label:       text-xs uppercase tracking-wider
```

---

## Appendix D: Animation Timing

### Duration Standards
```
Fast:        150ms  (hover states, focus rings)
Normal:      300ms  (buttons, cards, modals)
Slow:        500ms  (page transitions, complex animations)
Very Slow:   2500ms (background effects, shimmer)
```

### Easing Functions
```
Ease Out:    cubic-bezier(0, 0, 0.2, 1)    [Default]
Ease In:     cubic-bezier(0.4, 0, 1, 1)    [Exits]
Ease In Out: cubic-bezier(0.4, 0, 0.2, 1)  [Symmetrical]
Bounce:      cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

---

## Appendix E: Component Design System

### Card Anatomy
```tsx
<Card variant="luxury">
  <CardHeader>
    <CardIcon /> {/* Optional */}
    <CardTitle className="bliss-elegant" />
  </CardHeader>
  <CardBody className="diagonal-stripes-bliss">
    <Metric className="bliss-display text-3xl" />
    <Description className="bliss-body text-sm" />
  </CardBody>
  <CardFooter>
    <Action />
  </CardFooter>
</Card>
```

### Button Variants
```tsx
<Button variant="primary" size="lg">   {/* Plum, large */}
<Button variant="secondary" size="md"> {/* Espresso, medium */}
<Button variant="outline" size="sm">   {/* Outlined, small */}
<Button variant="ghost">               {/* Transparent */}
```

### Modal Structure
```tsx
<Modal size="lg" closeOnBackdrop>
  <ModalHeader className="bliss-display" />
  <ModalBody className="diagonal-stripes-bliss ornate-corners">
    <Form />
  </ModalBody>
  <ModalFooter>
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>
```

---

## Document Control

**Version History:**
- v1.0 (2026-01-20): Initial comprehensive plan created

**Approval Required From:**
- Product Owner: [ ]
- Technical Lead: [ ]
- Design Lead: [ ]

**Next Review Date:** Upon completion of Phase 1

**Document Location:** `docs/refactoring/UI-REFACTOR-PLAN.md`

---

**END OF REFACTORING PLAN**
