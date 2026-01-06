# Bakery Application Reference Documentation

> **Purpose**: This folder contains all documentation needed to build a bakery inventory management application based on the O'Takos Restaurant Dashboard.

---

## Quick Start

### Step 1: Product Discovery
Start with **03-PRODUCT-DISCOVERY-PROMPT.md** to:
- Define product vision and personas
- Create empathy maps and journey maps
- Plan the MVP through story mapping
- Prioritize features

### Step 2: Technical Reference
Use **01-APPLICATION-DOCUMENTATION.md** to understand:
- Complete tech stack and architecture
- Database schema patterns
- API endpoint structure
- Authentication & authorization model
- Internationalization approach

### Step 3: Design Implementation
Use **02-FRONTEND-DESIGN-SKILL.md** to:
- Apply the O'Takos visual design system
- Use consistent component patterns
- Implement dark mode correctly
- Follow responsive design patterns

---

## Files in This Folder

| File | Description |
|------|-------------|
| [01-APPLICATION-DOCUMENTATION.md](./01-APPLICATION-DOCUMENTATION.md) | Complete technical documentation of the O'Takos Dashboard including tech stack, database schema, API endpoints, features, and more |
| [02-FRONTEND-DESIGN-SKILL.md](./02-FRONTEND-DESIGN-SKILL.md) | Design system skill file with all UI patterns, colors, components, and styling guidelines |
| [03-PRODUCT-DISCOVERY-PROMPT.md](./03-PRODUCT-DISCOVERY-PROMPT.md) | Prompts for conducting product discovery with Claude - personas, empathy maps, story mapping, MVP definition |

---

## Key Differences: Restaurant vs Bakery App

| Feature | O'Takos (Restaurant) | Bakery App (New) |
|---------|---------------------|------------------|
| **Core Focus** | Financial tracking | Inventory management |
| **Inventory** | Basic (exists but not core) | Full inventory system |
| **Stock Alerts** | None | Low stock, critical alerts |
| **Production Tracking** | None | Daily ingredient usage |
| **Restock Planning** | None | Predictions, recommendations |
| **Expense Link** | Standalone | Linked to inventory purchases |
| **Reports** | Financial only | Financial + Inventory |

---

## Recommended Tech Stack (Same as Reference)

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: next-pwa
- **i18n**: Custom context-based (French/English)

---

## New Features to Add for Bakery

### Inventory Management
```prisma
model InventoryItem {
  id           String   @id @default(uuid())
  name         String
  category     String   // Dry goods, Dairy, Packaging, etc.
  unit         String   // kg, L, pieces
  currentStock Float    @default(0)
  minStock     Float    @default(0)
  reorderPoint Float    @default(0)
  unitCostGNF  Float    @default(0)
  supplierId   String?
  expiryDays   Int?     // Days until expiry (for perishables)
  isActive     Boolean  @default(true)
}

model StockMovement {
  id            String   @id @default(uuid())
  itemId        String
  type          String   // purchase, usage, waste, adjustment
  quantity      Float
  unitCost      Float?
  reason        String?
  productionBatchId String?  // Link to what was produced
  expenseId     String?      // Link to purchase expense
  createdBy     String
  createdAt     DateTime @default(now())
}

model ProductionLog {
  id         String   @id @default(uuid())
  date       DateTime
  productName String
  quantity   Int
  ingredients Json     // [{ itemId, quantity }]
  createdBy  String
  createdAt  DateTime @default(now())
}
```

### New API Endpoints
- `GET/POST /api/inventory` - Inventory CRUD
- `GET /api/inventory/low-stock` - Items below minimum
- `POST /api/inventory/[id]/adjust` - Stock adjustment
- `GET/POST /api/stock-movements` - Movement history
- `GET/POST /api/production-logs` - Daily production
- `GET /api/inventory/predictions` - Stockout predictions
- `GET /api/inventory/restock-recommendations` - What to buy

### New Pages
- `/inventory` - Inventory list with stock levels
- `/inventory/[id]` - Item detail with movement history
- `/production` - Daily production logging
- `/alerts` - Low stock and expiry alerts
- `/reports/inventory` - Inventory reports

---

## Suggested Workflow for Building

1. **Product Discovery** (1-2 days)
   - Use prompts to define vision, personas, MVP
   - Validate with bakery owner

2. **Project Setup** (1 day)
   - Clone/create Next.js project
   - Configure Tailwind with design system
   - Set up Prisma with database

3. **Authentication** (1 day)
   - NextAuth with Google OAuth
   - Role-based access (Manager/Editor)
   - Email whitelist

4. **Core Inventory** (3-4 days)
   - Inventory CRUD
   - Stock movements
   - Low stock alerts

5. **Production Tracking** (2-3 days)
   - Daily production log
   - Ingredient usage tracking
   - Auto-deduct from inventory

6. **Expense Integration** (2 days)
   - Link purchases to inventory
   - Auto-create stock movements

7. **Dashboard & Reports** (2-3 days)
   - Owner dashboard (remote monitoring)
   - Manager dashboard (daily ops)
   - Inventory reports

8. **Polish & PWA** (2 days)
   - Mobile optimization
   - Offline capability
   - Notification system

---

## Contact

- **Reference Project**: O'Takos Restaurant Dashboard
- **Location Context**: Guinea (Conakry) + Atlanta (USA)
- **Currency**: GNF (Guinean Franc)
- **Languages**: French (primary), English (secondary)

---

**Good luck building your bakery application!**
