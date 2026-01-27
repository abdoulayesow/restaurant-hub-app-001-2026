# Feature Requirements - January 2026

> **Status**: Draft
> **Last Updated**: 2026-01-26
> **Source**: Client feedback session

---

## Table of Contents

1. [Branding Page with Table Templates](#1-branding-page-with-table-templates)
2. [Payment Methods Standardization](#2-payment-methods-standardization)
3. [Production Type Enhancement](#3-production-type-enhancement)
4. [Sales Form Improvements](#4-sales-form-improvements)

---

## 1. Branding Page with Table Templates

### Problem Statement

Currently, there's no centralized branding management page with consistent table templates. Users need a dedicated page to manage branding-related data with the same polished table UI seen in sales and expenses pages.

### Requirements

#### 1.1 Page Structure

**Location:** `/app/branding/page.tsx`

**Components:**
- Header with title and add button
- Summary cards (similar to sales/expenses pages)
- Data table with sorting and filtering
- Add/Edit modal

#### 1.2 Table Template Features

**Required Columns:**
- Date/Name (primary identifier)
- Category/Type (with badge)
- Status (using StatusBadge component)
- Actions (View, Edit, Delete)

**Required Functionality:**
- **Sorting:** By date, name, category, status
- **Filtering:** Status dropdown, search input
- **Responsive Design:**
  - Mobile: Show only essential columns
  - Tablet: Add secondary columns
  - Desktop: Full table view
- **Dark Mode Support:** All components must work in both themes
- **Locale Support:** French (primary), English (secondary)

**Visual Style:**
```tsx
// Card/Table wrapper
"rounded-2xl shadow-sm border border-gray-200 dark:border-stone-700 bg-white dark:bg-stone-800"

// Table header
"bg-gray-50 dark:bg-stone-700/50 hover:bg-gray-100 dark:hover:bg-stone-700/70"

// Table row
"hover:bg-gray-50 dark:hover:bg-stone-700/30 transition-colors"

// Sort button
"flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-stone-300"
```

#### 1.3 Multiple Template Options

**Option A: Branding Assets**
- Logo variants (primary, secondary, monochrome)
- Color palettes per restaurant
- Typography presets
- Icon sets

**Option B: Product Catalog**
- Product name
- Category (Patisserie/Boulangerie)
- Unit price
- Image URL
- Status (Active/Inactive)

**Option C: Marketing Materials**
- Material type (Flyer, Menu, Sign)
- File URL
- Language
- Last updated
- Status

### Implementation Reference

**Refer to existing implementations:**
- `/components/sales/SalesTable.tsx` - Sorting, date formatting, action buttons
- `/components/expenses/ExpensesTable.tsx` - Payment status, badges, filters
- `/app/finances/sales/page.tsx` - Page layout, summary cards, data fetching

### Success Criteria

- [ ] Branding page follows same design patterns as sales/expenses
- [ ] Table supports sorting by at least 3 fields
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Dark mode styling matches existing pages
- [ ] French and English translations complete
- [ ] Add/Edit modal follows existing modal patterns

---

## 2. Payment Methods Standardization

### Problem Statement

The current system uses flexible payment methods, but the bakery only accepts 3 specific payment types. We need to standardize and simplify payment method handling across the entire application.

### Requirements

#### 2.1 Supported Payment Methods

**Fixed List (No Custom Methods):**
1. **Cash** (`Cash`)
   - Icon: `DollarSign`
   - Color: Green (`text-green-600 dark:text-green-400`)
   - Type: `cash`

2. **Orange Money** (`OrangeMoney`)
   - Icon: `Smartphone`
   - Color: Orange (`text-orange-600 dark:text-orange-400`)
   - Type: `mobile_money`

3. **Card/Credit Card** (`Card`)
   - Icon: `CreditCard`
   - Color: Blue (`text-blue-600 dark:text-blue-400`)
   - Type: `card`

#### 2.2 Database Changes

**Current State:**
- `PaymentMethod` model allows custom payment methods per restaurant
- `Expense` model uses string for `paymentMethod`

**Required Changes:**

**Option A: Keep current schema, seed with fixed methods**
```typescript
// prisma/seed.ts
const paymentMethods = [
  { name: 'Cash', nameFr: 'Espèces', type: 'cash', icon: 'DollarSign', color: '#059669' },
  { name: 'Orange Money', nameFr: 'Orange Money', type: 'mobile_money', icon: 'Smartphone', color: '#EA580C' },
  { name: 'Card', nameFr: 'Carte', type: 'card', icon: 'CreditCard', color: '#2563EB' },
]
```

**Option B: Create enum (simpler)**
```prisma
enum PaymentMethodType {
  Cash
  OrangeMoney
  Card
}

model Sale {
  // Change from individual fields to structured
  paymentBreakdown Json // { cash: 50000, orangeMoney: 30000, card: 20000 }
}

model Expense {
  paymentMethod PaymentMethodType
}
```

**Recommended:** Option A (less disruptive migration)

#### 2.3 UI Changes

**Sales Form:**
```tsx
// Current: Uses cashGNF, orangeMoneyGNF, cardGNF fields
// Required: Keep same structure, but enforce only these 3 fields

<div className="space-y-3">
  <label>{t('sales.cash')}</label>
  <input type="number" name="cashGNF" />

  <label>{t('sales.orangeMoney')}</label>
  <input type="number" name="orangeMoneyGNF" />

  <label>{t('sales.card')}</label>
  <input type="number" name="cardGNF" />
</div>
```

**Expenses Form:**
```tsx
// Current: Dropdown with custom methods
// Required: Radio buttons or dropdown with ONLY 3 options

<div className="space-y-2">
  <label>{t('expenses.paymentMethod')}</label>
  <select name="paymentMethod">
    <option value="Cash">{t('expenses.cash')}</option>
    <option value="Orange Money">{t('expenses.orangeMoney')}</option>
    <option value="Card">{t('expenses.card')}</option>
  </select>
</div>
```

#### 2.4 API Changes

**Validation:**
- All endpoints accepting payment methods must validate against whitelist
- Return 400 Bad Request if invalid payment method provided

```typescript
// lib/validators.ts
export const ALLOWED_PAYMENT_METHODS = ['Cash', 'Orange Money', 'Card'] as const
export type AllowedPaymentMethod = typeof ALLOWED_PAYMENT_METHODS[number]

export function validatePaymentMethod(method: string): method is AllowedPaymentMethod {
  return ALLOWED_PAYMENT_METHODS.includes(method as AllowedPaymentMethod)
}
```

#### 2.5 Affected Pages/Components

**Must Update:**
- [ ] `/app/finances/sales/page.tsx` - Sales form
- [ ] `/components/sales/AddEditSaleModal.tsx` - Form fields
- [ ] `/app/finances/expenses/page.tsx` - Expenses form
- [ ] `/components/expenses/AddEditExpenseModal.tsx` - Payment method dropdown
- [ ] `/components/expenses/ExpensesTable.tsx` - Update paymentMethodConfig
- [ ] `/components/dashboard/*` - Payment breakdown displays
- [ ] All API routes validating payment methods

### Success Criteria

- [ ] Only 3 payment methods available throughout app
- [ ] All existing payment method references updated
- [ ] API validation prevents invalid payment methods
- [ ] No UI allows creating custom payment methods
- [ ] Data migration plan for existing custom payment methods (if any)

---

## 3. Production Type Enhancement

### Problem Statement

The production logging system doesn't distinguish between bakery types (Patisserie vs Boulangerie) or track specific products made daily. Staff need to log production by type with predefined product lists.

### Requirements

#### 3.1 Production Types

**Two Production Types:**
1. **Patisserie** (Pastry)
2. **Boulangerie** (Bakery)

#### 3.2 Product Catalog

**Patisserie Products:**
| Product Name (FR) | Unit | Typical Quantity |
|-------------------|------|------------------|
| Croissant | piece | 50-100 |
| Pain au chocolat | piece | 40-80 |
| Pain au raisin | piece | 5-20 |
| Friand poulet | piece | 5-15 |
| Pain de mie | loaf | 10-20 |

**Boulangerie Products:**
| Product Name (FR) | Unit | Typical Quantity |
|-------------------|------|------------------|
| Baguette | piece | 10-30 |
| Mini Baguette | piece | 20-50 |
| Mini complet | piece | 5-20 |
| Mini de 2500 | piece | 10-30 |
| Mini Mini | piece | 500-2000 |

**Notes:**
- Products are restaurant-specific but can be seeded with these defaults
- Each product links to ingredients (existing functionality)
- Products have a category (Patisserie/Boulangerie)

#### 3.3 Database Changes

**New Model: Product**
```prisma
model Product {
  id             String          @id @default(uuid())
  restaurantId   String
  restaurant     Restaurant      @relation(fields: [restaurantId], references: [id])
  name           String
  nameFr         String?
  category       ProductCategory // Patisserie | Boulangerie
  unit           String          @default("piece") // piece, loaf, dozen
  standardRecipe Json?           // [{ itemId, quantity, unit }]
  isActive       Boolean         @default(true)
  sortOrder      Int             @default(0)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  productionItems ProductionItem[]

  @@index([restaurantId])
  @@index([category])
  @@index([isActive])
}

enum ProductCategory {
  Patisserie
  Boulangerie
}

// Junction table for ProductionLog <-> Product
model ProductionItem {
  id              String        @id @default(uuid())
  productionLogId String
  productionLog   ProductionLog @relation(fields: [productionLogId], references: [id], onDelete: Cascade)
  productId       String
  product         Product       @relation(fields: [productId], references: [id])
  quantity        Int

  @@index([productionLogId])
  @@index([productId])
}
```

**Update ProductionLog Model:**
```prisma
model ProductionLog {
  // ... existing fields
  productionType  ProductCategory? // Patisserie | Boulangerie
  productionItems ProductionItem[] // NEW: Multiple products per log

  // DEPRECATED (keep for backward compatibility):
  // productName, productNameFr, quantity
}
```

#### 3.4 UI Changes

**Production Form (`AddEditProductionModal.tsx`):**

```tsx
// Step 1: Select Production Type
<div>
  <label>{t('production.productionType')}</label>
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={() => setProductionType('Patisserie')}
      className={productionType === 'Patisserie' ? 'active' : ''}
    >
      🥐 {t('production.patisserie')}
    </button>
    <button
      onClick={() => setProductionType('Boulangerie')}
      className={productionType === 'Boulangerie' ? 'active' : ''}
    >
      🥖 {t('production.boulangerie')}
    </button>
  </div>
</div>

// Step 2: Select Products (filtered by type)
<div className="space-y-3">
  <label>{t('production.productsProduced')}</label>
  {filteredProducts.map(product => (
    <div key={product.id} className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={selectedProducts.includes(product.id)}
        onChange={() => toggleProduct(product.id)}
      />
      <label className="flex-1">{product.nameFr || product.name}</label>
      {selectedProducts.includes(product.id) && (
        <input
          type="number"
          placeholder={t('production.quantity')}
          value={productQuantities[product.id] || ''}
          onChange={(e) => updateQuantity(product.id, e.target.value)}
          className="w-24"
        />
      )}
    </div>
  ))}
</div>

// Step 3: Ingredients (existing functionality, auto-calculate from recipes)
// Step 4: Notes (existing)
```

**Production Table:**
- Add "Type" column (Patisserie/Boulangerie badge)
- Show multiple products in row (comma-separated or expandable)
- Filter by production type

#### 3.5 Seed Data

```typescript
// prisma/seed.ts
const patisserieProducts = [
  { name: 'Croissant', nameFr: 'Croissant', category: 'Patisserie', unit: 'piece' },
  { name: 'Pain au chocolat', nameFr: 'Pain au chocolat', category: 'Patisserie', unit: 'piece' },
  { name: 'Pain au raisin', nameFr: 'Pain au raisin', category: 'Patisserie', unit: 'piece' },
  { name: 'Chicken Pastry', nameFr: 'Friand poulet', category: 'Patisserie', unit: 'piece' },
  { name: 'Sandwich Loaf', nameFr: 'Pain de mie', category: 'Patisserie', unit: 'loaf' },
]

const boulangerieProducts = [
  { name: 'Baguette', nameFr: 'Baguette', category: 'Boulangerie', unit: 'piece' },
  { name: 'Mini Baguette', nameFr: 'Mini Baguette', category: 'Boulangerie', unit: 'piece' },
  { name: 'Mini complet', nameFr: 'Mini complet', category: 'Boulangerie', unit: 'piece' },
  { name: 'Mini de 2500', nameFr: 'Mini de 2500', category: 'Boulangerie', unit: 'piece' },
  { name: 'Mini Mini', nameFr: 'Mini Mini', category: 'Boulangerie', unit: 'piece' },
]
```

#### 3.6 API Changes

**New Endpoint:**
- `GET /api/products?restaurantId=...&category=Patisserie`
- `POST /api/products` - Manager only
- `PUT /api/products/[id]` - Manager only

**Updated Endpoint:**
- `POST /api/production` - Accept `productionType` and `productionItems[]`

### Success Criteria

- [ ] Production form allows selecting type (Patisserie/Boulangerie)
- [ ] Products filtered based on selected type
- [ ] Multiple products can be added per production log
- [ ] Quantities captured per product
- [ ] Existing production logs still viewable (backward compatibility)
- [ ] Seed data creates default products for both types
- [ ] Products manageable by Manager role

---

## 4. Sales Form Improvements

### Problem Statement

The current sales form allows duplicate entries for the same date and doesn't track individual product sales. We need to prevent duplicates and optionally capture product-level sales data.

### Requirements

#### 4.1 Prevent Duplicate Sales

**Business Rule:**
- Only ONE sale record allowed per restaurant per date
- System must check for existing sale before allowing new entry

**Database Constraint (Already Exists):**
```prisma
model Sale {
  // ...
  @@unique([restaurantId, date]) // Enforces uniqueness
}
```

**UI Validation:**

**Sales Form (`AddEditSaleModal.tsx`):**
```tsx
// Add validation on date change
const [dateError, setDateError] = useState<string | null>(null)

const handleDateChange = async (selectedDate: Date) => {
  setDate(selectedDate)

  // Check if sale exists for this date
  const response = await fetch(`/api/sales/check-date?restaurantId=${restaurantId}&date=${selectedDate.toISOString()}`)
  const { exists, saleId } = await response.json()

  if (exists && saleId !== currentSaleId) {
    setDateError(t('sales.duplicateDateError'))
    // Show link to edit existing sale
  } else {
    setDateError(null)
  }
}
```

**Error Message:**
- French: "Une vente existe déjà pour cette date. [Modifier la vente existante](#)"
- English: "A sale already exists for this date. [Edit existing sale](#)"

**API Validation:**
```typescript
// app/api/sales/route.ts (POST)
export async function POST(req: Request) {
  const { restaurantId, date, ... } = await req.json()

  // Check for duplicate
  const existing = await prisma.sale.findUnique({
    where: {
      restaurantId_date: { restaurantId, date: new Date(date) }
    }
  })

  if (existing) {
    return NextResponse.json(
      { error: 'A sale already exists for this date' },
      { status: 409 } // Conflict
    )
  }

  // Proceed with creation
}
```

#### 4.2 Optional Product Sales Tracking

**Business Rule:**
- Product sales are OPTIONAL (not required)
- If provided, track product name and quantity sold
- Products come from the Product catalog (created in Feature 3)

**Database Changes:**

**New Model: SaleItem**
```prisma
model SaleItem {
  id        String   @id @default(uuid())
  saleId    String
  sale      Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId String?  // Optional: links to Product catalog
  product   Product? @relation(fields: [productId], references: [id])

  // Manual entry (if product not in catalog)
  productName   String?
  productNameFr String?

  quantity  Int
  unitPrice Float?   // Optional: unit price per item

  createdAt DateTime @default(now())

  @@index([saleId])
  @@index([productId])
}

model Sale {
  // ... existing fields
  saleItems SaleItem[] // NEW: Optional product breakdown
}
```

**UI Changes:**

**Sales Form - Add Optional Section:**
```tsx
<div className="mt-6 border-t pt-6">
  <div className="flex items-center justify-between mb-3">
    <label className="text-sm font-medium">
      {t('sales.productsSold')} ({t('common.optional')})
    </label>
    <button
      type="button"
      onClick={() => setShowProducts(!showProducts)}
      className="text-sm text-blue-600 hover:text-blue-700"
    >
      {showProducts ? t('common.hide') : t('common.show')}
    </button>
  </div>

  {showProducts && (
    <div className="space-y-3">
      {saleItems.map((item, index) => (
        <div key={index} className="flex gap-3 items-center">
          <select
            value={item.productId || ''}
            onChange={(e) => updateSaleItem(index, 'productId', e.target.value)}
            className="flex-1"
          >
            <option value="">{t('sales.selectProduct')}</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.nameFr || p.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder={t('sales.quantity')}
            value={item.quantity}
            onChange={(e) => updateSaleItem(index, 'quantity', e.target.value)}
            className="w-24"
          />

          <button
            type="button"
            onClick={() => removeSaleItem(index)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addSaleItem}
        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        {t('sales.addProduct')}
      </button>
    </div>
  )}
</div>
```

**Sales Detail View:**
- Show product breakdown if available
- Display table with: Product, Quantity, Unit Price (if available)

#### 4.3 API Changes

**New Endpoint:**
- `GET /api/sales/check-date?restaurantId=...&date=...` - Returns { exists, saleId }

**Updated Endpoint:**
- `POST /api/sales` - Accept optional `saleItems[]` array
- `PUT /api/sales/[id]` - Update sale items if provided

**Validation:**
- Date uniqueness check
- Sale items validation (positive quantities, valid product IDs)

#### 4.4 Migration Considerations

**Backward Compatibility:**
- Existing sales without product items remain valid
- Product tracking is opt-in, not required
- Sales reports work with or without product data

### Success Criteria

- [ ] Cannot create duplicate sales for same date
- [ ] Clear error message shown when duplicate detected
- [ ] Link to edit existing sale provided
- [ ] API returns 409 Conflict for duplicate attempts
- [ ] Product sales section is optional and collapsible
- [ ] Products loaded from Product catalog
- [ ] Quantities captured per product
- [ ] Sales detail view shows product breakdown (if available)
- [ ] Existing sales unaffected by changes

---

## Translation Keys

### Required Additions to `public/locales/en.json` and `fr.json`

```json
{
  "branding": {
    "title": "Branding Management",
    "addItem": "Add Branding Item",
    "type": "Type",
    "status": "Status"
  },
  "production": {
    "productionType": "Production Type",
    "patisserie": "Patisserie",
    "boulangerie": "Boulangerie",
    "productsProduced": "Products Produced",
    "selectProducts": "Select products and quantities"
  },
  "sales": {
    "productsSold": "Products Sold",
    "selectProduct": "Select a product",
    "addProduct": "Add Product",
    "quantity": "Quantity",
    "duplicateDateError": "A sale already exists for this date",
    "editExistingSale": "Edit existing sale",
    "cash": "Cash",
    "orangeMoney": "Orange Money",
    "card": "Card"
  },
  "expenses": {
    "cash": "Cash",
    "orangeMoney": "Orange Money",
    "card": "Card"
  },
  "common": {
    "optional": "Optional",
    "show": "Show",
    "hide": "Hide"
  }
}
```

**French Translations:**
```json
{
  "branding": {
    "title": "Gestion de la marque",
    "addItem": "Ajouter un élément",
    "type": "Type",
    "status": "Statut"
  },
  "production": {
    "productionType": "Type de production",
    "patisserie": "Pâtisserie",
    "boulangerie": "Boulangerie",
    "productsProduced": "Produits fabriqués",
    "selectProducts": "Sélectionnez les produits et les quantités"
  },
  "sales": {
    "productsSold": "Produits vendus",
    "selectProduct": "Sélectionnez un produit",
    "addProduct": "Ajouter un produit",
    "quantity": "Quantité",
    "duplicateDateError": "Une vente existe déjà pour cette date",
    "editExistingSale": "Modifier la vente existante",
    "cash": "Espèces",
    "orangeMoney": "Orange Money",
    "card": "Carte"
  },
  "expenses": {
    "cash": "Espèces",
    "orangeMoney": "Orange Money",
    "card": "Carte"
  },
  "common": {
    "optional": "Optionnel",
    "show": "Afficher",
    "hide": "Masquer"
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create database migrations for new models (Product, ProductionItem, SaleItem)
- [ ] Add translation keys to en.json and fr.json
- [ ] Create seed data for products (Patisserie/Boulangerie)
- [ ] Implement payment method validation helper

### Phase 2: Payment Methods (Week 1)
- [ ] Update expense form to use fixed payment methods
- [ ] Update sales form payment breakdown (already fixed)
- [ ] Update ExpensesTable payment method config
- [ ] Add API validation for payment methods
- [ ] Test all payment flows

### Phase 3: Production Enhancement (Week 2)
- [ ] Create Product API endpoints
- [ ] Build production type selector in form
- [ ] Implement product selection with quantities
- [ ] Update production table to show type and products
- [ ] Test with sample production logs

### Phase 4: Sales Improvements (Week 2)
- [ ] Implement duplicate date check API endpoint
- [ ] Add date validation to sales form
- [ ] Create SaleItem management in sales form
- [ ] Update sales detail view to show products
- [ ] Test duplicate prevention and product tracking

### Phase 5: Branding Page (Week 3)
- [ ] Design branding page structure
- [ ] Decide on branding data model (Assets/Catalog/Materials)
- [ ] Implement table template following sales/expenses pattern
- [ ] Build add/edit modal
- [ ] Add filters and sorting

### Phase 6: Testing & Polish (Week 3)
- [ ] End-to-end testing of all features
- [ ] Mobile responsiveness check
- [ ] Dark mode verification
- [ ] Translation completeness check
- [ ] Performance testing
- [ ] User acceptance testing with client

---

## Design Mockups Needed

Before implementation, create mockups for:

1. **Branding Page Layout** - Overall page structure with table
2. **Production Form - Type Selection** - Two-button toggle UI
3. **Production Form - Product Selection** - Checkbox list with quantity inputs
4. **Sales Form - Product Section** - Collapsible optional section
5. **Sales Detail - Product Breakdown** - Table showing products sold

---

## Testing Checklist

### Payment Methods
- [ ] Can only select Cash, Orange Money, or Card in expenses
- [ ] Sales form only shows 3 payment method fields
- [ ] API rejects invalid payment methods
- [ ] Existing data migrated or handled gracefully

### Production
- [ ] Can select Patisserie or Boulangerie
- [ ] Products filter based on type
- [ ] Multiple products can be added
- [ ] Quantities saved correctly
- [ ] Old production logs still display

### Sales
- [ ] Cannot create duplicate sale for same date
- [ ] Clear error shown with link to existing sale
- [ ] Product section is optional
- [ ] Products save correctly when provided
- [ ] Sales work fine without products

### Branding
- [ ] Page follows design patterns from sales/expenses
- [ ] Sorting works on all columns
- [ ] Filters work correctly
- [ ] Mobile responsive
- [ ] Dark mode works

---

## Open Questions

1. **Branding Page Scope:** Which data model should we implement first? (Assets, Catalog, or Materials)
2. **Product Recipes:** Should products have standard recipes linked to inventory items?
3. **Product Pricing:** Should we track unit prices for products in sales?
4. **Historical Data:** How to handle sales/expenses with custom payment methods (if any exist)?
5. **Product Management:** Should Editors be able to add/edit products, or Manager-only?

---

## Success Metrics

- **Payment Methods:** 100% of transactions use one of 3 approved methods
- **Production:** 80%+ of production logs include product breakdown within 2 weeks
- **Sales:** Zero duplicate sales entries after deployment
- **Sales Products:** 30%+ of sales include optional product tracking within 1 month
- **Branding:** Manager uses branding page at least weekly

---

## Notes

- All features should follow existing design patterns
- Maintain backward compatibility where possible
- Mobile-first responsive design required
- French translations are primary, English secondary
- Test with both Manager and Editor roles
