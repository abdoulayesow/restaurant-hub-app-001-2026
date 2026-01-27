# Implementation Checklist - January 2026 Features

> Quick reference checklist for implementing the 4 new features
> See [FEATURE-REQUIREMENTS-JAN2026.md](./FEATURE-REQUIREMENTS-JAN2026.md) for complete specifications

---

## Feature 1: Branding Page with Table Templates

### Database & Models
- [ ] Decide on branding data model (Assets/Catalog/Materials)
- [ ] Create Prisma schema for branding model
- [ ] Run migration: `npx prisma migrate dev --name add_branding`
- [ ] Add seed data if needed

### API Routes
- [ ] `GET /api/branding` - List branding items
- [ ] `POST /api/branding` - Create branding item
- [ ] `PUT /api/branding/[id]` - Update branding item
- [ ] `DELETE /api/branding/[id]` - Delete branding item

### Components
- [ ] Create `components/branding/BrandingTable.tsx`
  - Copy structure from `SalesTable.tsx` or `ExpensesTable.tsx`
  - Add sorting functionality
  - Add responsive columns (mobile/tablet/desktop)
  - Dark mode support
- [ ] Create `components/branding/AddEditBrandingModal.tsx`
  - Form fields based on chosen data model
  - Validation
  - i18n support
- [ ] Create `app/branding/page.tsx`
  - Summary cards
  - Table integration
  - Filters (status, search)
  - Add button

### Translations
- [ ] Add to `public/locales/en.json`:
  ```json
  "branding": {
    "title": "Branding Management",
    "addItem": "Add Branding Item",
    "type": "Type",
    "status": "Status"
  }
  ```
- [ ] Add to `public/locales/fr.json`:
  ```json
  "branding": {
    "title": "Gestion de la marque",
    "addItem": "Ajouter un élément",
    "type": "Type",
    "status": "Statut"
  }
  ```

### Testing
- [ ] Test table sorting
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test dark mode
- [ ] Test add/edit/delete flows
- [ ] Test Manager vs Editor permissions

---

## Feature 2: Payment Methods Standardization

### Database & Validation
- [ ] Create validation helper in `lib/validators.ts`:
  ```typescript
  export const ALLOWED_PAYMENT_METHODS = ['Cash', 'Orange Money', 'Card']
  export function validatePaymentMethod(method: string): boolean
  ```
- [ ] Seed fixed payment methods in `prisma/seed.ts`
- [ ] Optional: Clean up existing custom payment methods (if any)

### Sales Components
- [ ] Update `components/sales/AddEditSaleModal.tsx`
  - Keep cashGNF, orangeMoneyGNF, cardGNF fields
  - Remove any dynamic payment method creation
- [ ] Verify `components/sales/SalesTable.tsx`
  - Should already show Cash/Orange/Card columns
  - No changes needed (already fixed)

### Expenses Components
- [ ] Update `components/expenses/AddEditExpenseModal.tsx`
  - Replace dynamic payment method dropdown with fixed 3 options
  - Use select or radio buttons:
    ```tsx
    <select name="paymentMethod">
      <option value="Cash">{t('expenses.cash')}</option>
      <option value="Orange Money">{t('expenses.orangeMoney')}</option>
      <option value="Card">{t('expenses.card')}</option>
    </select>
    ```
- [ ] Update `components/expenses/ExpensesTable.tsx`
  - Update `paymentMethodConfig` to only include Cash/Orange/Card
  - Remove fallback for unknown payment methods

### API Routes
- [ ] Add validation to `app/api/sales/route.ts` (POST, PUT)
  - Validate payment breakdown uses only allowed methods
- [ ] Add validation to `app/api/expenses/route.ts` (POST, PUT)
  - Validate paymentMethod is one of allowed methods
  - Return 400 Bad Request if invalid

### Translations
- [ ] Verify translations exist in both en.json and fr.json:
  ```json
  "expenses": {
    "cash": "Cash" / "Espèces",
    "orangeMoney": "Orange Money",
    "card": "Card" / "Carte"
  }
  ```

### Testing
- [ ] Test creating sale with all 3 payment methods
- [ ] Test creating expense with each payment method
- [ ] Test API rejects invalid payment methods
- [ ] Verify all existing payment displays work correctly
- [ ] Test mobile payment method displays

---

## Feature 3: Production Type Enhancement

### Database & Models
- [ ] Add to `prisma/schema.prisma`:
  ```prisma
  enum ProductCategory {
    Patisserie
    Boulangerie
  }

  model Product {
    id           String          @id @default(uuid())
    restaurantId String
    name         String
    nameFr       String?
    category     ProductCategory
    unit         String          @default("piece")
    isActive     Boolean         @default(true)
    // ... other fields
  }

  model ProductionItem {
    id              String
    productionLogId String
    productId       String
    quantity        Int
    // ... relations
  }
  ```
- [ ] Update `ProductionLog` model:
  - Add `productionType ProductCategory?`
  - Add `productionItems ProductionItem[]`
- [ ] Run migration: `npx prisma migrate dev --name add_production_types`

### Seed Data
- [ ] Add to `prisma/seed.ts`:
  ```typescript
  const patisserieProducts = [
    { name: 'Croissant', nameFr: 'Croissant', category: 'Patisserie' },
    { name: 'Pain au chocolat', nameFr: 'Pain au chocolat', category: 'Patisserie' },
    { name: 'Pain au raisin', nameFr: 'Pain au raisin', category: 'Patisserie' },
    { name: 'Chicken Pastry', nameFr: 'Friand poulet', category: 'Patisserie' },
    { name: 'Sandwich Loaf', nameFr: 'Pain de mie', category: 'Patisserie' },
  ]

  const boulangerieProducts = [
    { name: 'Baguette', nameFr: 'Baguette', category: 'Boulangerie' },
    { name: 'Mini Baguette', nameFr: 'Mini Baguette', category: 'Boulangerie' },
    { name: 'Mini complet', nameFr: 'Mini complet', category: 'Boulangerie' },
    { name: 'Mini de 2500', nameFr: 'Mini de 2500', category: 'Boulangerie' },
    { name: 'Mini Mini', nameFr: 'Mini Mini', category: 'Boulangerie' },
  ]
  ```
- [ ] Run seed: `npx prisma db seed`

### API Routes
- [ ] `GET /api/products?restaurantId=...&category=...` - List products
- [ ] `POST /api/products` - Create product (Manager only)
- [ ] `PUT /api/products/[id]` - Update product (Manager only)
- [ ] Update `POST /api/production` - Accept productionType and productionItems[]
- [ ] Update `PUT /api/production/[id]` - Update with new structure

### Components
- [ ] Update `components/production/AddEditProductionModal.tsx`
  - Add production type selector (Patisserie/Boulangerie buttons)
  - Add product selection section
    - Fetch products filtered by type
    - Checkbox list with quantity inputs
    - Dynamic add/remove
  - Keep ingredient section (auto-calculate from recipes)
  - Form state management for products
- [ ] Update `components/production/ProductionTable.tsx`
  - Add "Type" column with badge
  - Show multiple products per row
  - Add filter by production type

### Translations
- [ ] Add to both en.json and fr.json:
  ```json
  "production": {
    "productionType": "Production Type",
    "patisserie": "Patisserie",
    "boulangerie": "Boulangerie",
    "productsProduced": "Products Produced",
    "selectProducts": "Select products and quantities"
  }
  ```

### Testing
- [ ] Test selecting Patisserie type
- [ ] Test selecting Boulangerie type
- [ ] Test products filter correctly by type
- [ ] Test adding multiple products with quantities
- [ ] Test saving production log with products
- [ ] Test viewing existing production logs (backward compatibility)
- [ ] Test mobile responsive product selection

---

## Feature 4: Sales Form Improvements

### Database & Models
- [ ] Verify constraint exists in schema:
  ```prisma
  model Sale {
    // ...
    @@unique([restaurantId, date])
  }
  ```
- [ ] Add to `prisma/schema.prisma`:
  ```prisma
  model SaleItem {
    id            String   @id @default(uuid())
    saleId        String
    productId     String?
    productName   String?
    productNameFr String?
    quantity      Int
    unitPrice     Float?
    // ... relations
  }

  model Sale {
    // ... existing fields
    saleItems SaleItem[]
  }
  ```
- [ ] Run migration: `npx prisma migrate dev --name add_sale_items`

### API Routes
- [ ] `GET /api/sales/check-date?restaurantId=...&date=...`
  - Check if sale exists for date
  - Return: `{ exists: boolean, saleId?: string }`
- [ ] Update `POST /api/sales`
  - Check for duplicate date (409 Conflict if exists)
  - Accept optional `saleItems[]`
  - Create sale items if provided
- [ ] Update `PUT /api/sales/[id]`
  - Update sale items if provided
  - Delete removed items, add new ones

### Components
- [ ] Update `components/sales/AddEditSaleModal.tsx`
  - Add date validation:
    ```tsx
    const handleDateChange = async (date: Date) => {
      const res = await fetch(`/api/sales/check-date?restaurantId=${restaurantId}&date=${date}`)
      const { exists, saleId } = await res.json()
      if (exists && saleId !== currentSaleId) {
        setDateError(t('sales.duplicateDateError'))
      }
    }
    ```
  - Add optional product section:
    - Collapsible section (Show/Hide button)
    - Product dropdown (from Product catalog)
    - Quantity input
    - Add/Remove buttons
    - State management for sale items
- [ ] Update `components/sales/SaleDetailModal.tsx` or equivalent
  - Add product breakdown table if saleItems exist
  - Show: Product Name, Quantity, Unit Price (if available)

### Translations
- [ ] Add to both en.json and fr.json:
  ```json
  "sales": {
    "productsSold": "Products Sold",
    "selectProduct": "Select a product",
    "addProduct": "Add Product",
    "quantity": "Quantity",
    "duplicateDateError": "A sale already exists for this date",
    "editExistingSale": "Edit existing sale"
  },
  "common": {
    "optional": "Optional",
    "show": "Show",
    "hide": "Hide"
  }
  ```

### Testing
- [ ] Test creating sale for new date (should succeed)
- [ ] Test creating sale for existing date (should fail with error)
- [ ] Test error message shows link to existing sale
- [ ] Test API returns 409 Conflict for duplicate
- [ ] Test adding products to sale (optional)
- [ ] Test sale works without products
- [ ] Test product breakdown displays in detail view
- [ ] Test editing sale with products

---

## Cross-Feature Testing

### Integration Tests
- [ ] Create production log with products → Check stock deduction
- [ ] Create sale with products → Verify data saved correctly
- [ ] Create expense with payment method → Verify only 3 options available
- [ ] Switch restaurant → Verify products filter by restaurant
- [ ] Manager vs Editor permissions on all new features

### Responsive Design
- [ ] Test all new pages on mobile (320px)
- [ ] Test all new pages on tablet (768px)
- [ ] Test all new pages on desktop (1920px)
- [ ] Verify dark mode on all new pages
- [ ] Test touch interactions (modals, dropdowns, buttons)

### Performance
- [ ] Check product list load time (should be < 500ms)
- [ ] Check sales duplicate validation (should be < 300ms)
- [ ] Check branding table sort performance (> 100 items)
- [ ] Verify no N+1 queries in production endpoints

### i18n Completeness
- [ ] All French translations added
- [ ] All English translations added
- [ ] No hardcoded strings in components
- [ ] Date/time formatting uses locale-aware formatters
- [ ] Currency formatting uses locale-aware formatters

---

## Pre-Production Checklist

### Code Quality
- [ ] Run `npm run lint` - No errors
- [ ] Run `npm run build` - Successful build
- [ ] Type check: `npx tsc --noEmit` - No type errors
- [ ] Run any existing tests: `npm test`

### Database
- [ ] All migrations applied successfully
- [ ] Seed data loaded correctly
- [ ] Backup production database before deployment
- [ ] Test rollback procedure

### Documentation
- [ ] Update API documentation if exists
- [ ] Update component documentation
- [ ] Add inline code comments for complex logic
- [ ] Update README if needed

### Deployment
- [ ] Test in staging environment first
- [ ] Verify environment variables set correctly
- [ ] Run migrations on production: `npx prisma migrate deploy`
- [ ] Deploy application
- [ ] Smoke test all new features in production
- [ ] Monitor error logs for first 24 hours

### User Training
- [ ] Create user guide for new features (optional)
- [ ] Notify users of changes
- [ ] Provide support contact for questions
- [ ] Schedule follow-up session with client

---

## Estimated Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Week 1: Foundation** | 2-3 days | Database models, migrations, seed data, payment method updates |
| **Week 2: Production & Sales** | 3-4 days | Production type enhancement, sales improvements, API endpoints |
| **Week 3: Branding & Polish** | 3-4 days | Branding page, comprehensive testing, bug fixes |
| **Buffer** | 2-3 days | Unexpected issues, refinements, user feedback |

**Total: 10-14 days**

---

## Priority Order

If implementing incrementally, use this order:

1. **Payment Methods** (Low risk, high impact) - 1 day
2. **Sales Duplicate Prevention** (Critical business rule) - 1 day
3. **Production Types** (Core business need) - 3 days
4. **Sales Product Tracking** (Optional enhancement) - 2 days
5. **Branding Page** (Nice to have) - 3-4 days

---

## Rollback Plan

If issues arise after deployment:

1. **Database Migration Rollback:**
   ```bash
   npx prisma migrate resolve --rolled-back [migration_name]
   ```

2. **Code Rollback:**
   - Revert to previous Git commit
   - Redeploy previous version

3. **Data Recovery:**
   - Restore from database backup
   - Re-run migrations if needed

4. **Communication:**
   - Notify users of rollback
   - Document issues encountered
   - Plan fixes for next deployment
