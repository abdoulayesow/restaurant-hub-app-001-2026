# Bakery Hub - Product Vision Document

> **Status**: Draft
> **Last Updated**: 2026-01-05

---

## 1. Product Vision Statement

**FOR** bakery owners and managers in West Africa
**WHO** need to track inventory, manage expenses, record daily sales, and operate their business remotely
**THE** Bakery Hub **IS A** cloud-based bakery management platform
**THAT** provides real-time inventory visibility, automated restock alerts via SMS/WhatsApp, integrated expense tracking, and daily sales recording
**UNLIKE** spreadsheets and manual tracking methods
**OUR PRODUCT** offers mobile-first access, offline capability, and intelligent predictions that prevent production stops due to ingredient shortages.

---

## 2. Business Context

| Attribute | Value |
|-----------|-------|
| **Business Type** | Bakery |
| **Location** | Conakry, Guinea |
| **Owner Location** | Atlanta, USA (remote management) |
| **Primary Currency** | GNF (Guinean Franc) |
| **Secondary Currency** | EUR (for reference) |
| **Primary Language** | French |
| **Secondary Language** | English |
| **Staff** | On-site manager, bakers, sales staff |

---

## 3. Core Pain Points to Solve

1. **Real-time Inventory Visibility** - Owner can't see stock levels from Atlanta
2. **Stockout Prevention** - Running out of key ingredients causes production stops
3. **Expense Tracking** - Expenses not categorized properly, no link to inventory purchases
4. **Sales Tracking** - Need visibility into daily revenue and payment methods
5. **Communication Gap** - No automated alerts when issues arise

---

## 4. Key Differentiators from O'Takos Reference

| Feature | O'Takos (Restaurant) | Bakery Hub (New) |
|---------|---------------------|------------------|
| **Core Focus** | Financial tracking | Inventory + Financial |
| **Inventory** | Basic/not core | Full inventory system |
| **Stock Alerts** | None | Low stock, critical alerts via SMS/WhatsApp |
| **Production Tracking** | None | Daily ingredient usage |
| **Restock Planning** | None | Predictions, recommendations |
| **Expense Link** | Standalone | Linked to inventory purchases |
| **Notifications** | None | SMS/WhatsApp integration |

---

## 5. User Personas

### Persona 1: The Remote Owner

| Attribute | Details |
|-----------|---------|
| **Name** | Amadou Diallo |
| **Age** | 45 |
| **Location** | Atlanta, USA |
| **Role** | Business Owner |
| **Technical Comfort** | Moderate - uses smartphone daily, comfortable with apps |

**Goals & Motivations:**
- Monitor bakery operations from 8,000 km away
- Know inventory status without calling staff
- Ensure business is profitable
- Trust but verify staff activities

**Frustrations & Pain Points:**
- Time zone difference (5-6 hours) makes calls difficult
- Never knows true inventory levels until crisis hits
- Surprised by unexpected expenses
- Can't tell which products are profitable

**Key Tasks:**
- Check daily sales and revenue
- Review inventory levels and alerts
- Approve large expenses
- View financial reports and trends

**Quote:** *"I need to see what's happening in my bakery without having to call my manager at midnight."*

---

### Persona 2: The On-Site Manager

| Attribute | Details |
|-----------|---------|
| **Name** | Fatoumata Camara |
| **Age** | 32 |
| **Location** | Conakry, Guinea |
| **Role** | Bakery Manager |
| **Technical Comfort** | Moderate - uses WhatsApp, basic smartphone skills |

**Goals & Motivations:**
- Keep production running smoothly
- Avoid blame for stockouts
- Prove she's doing her job well
- Simplify daily reporting to owner

**Frustrations & Pain Points:**
- Manually counting inventory takes time
- Forgets to report low stock until it's critical
- Paper records get lost or damaged
- Explaining expenses over WhatsApp is tedious

**Key Tasks:**
- Record daily sales at end of day
- Submit expense requests with receipts
- Update inventory when purchases arrive
- Log daily production quantities

**Quote:** *"If I had alerts when flour is running low, I wouldn't have to remember everything myself."*

---

### Persona 3: The Baker (Production Staff)

| Attribute | Details |
|-----------|---------|
| **Name** | Ibrahima Bah |
| **Age** | 28 |
| **Location** | Conakry, Guinea |
| **Role** | Head Baker |
| **Technical Comfort** | Low - basic phone use, prefers physical work |

**Goals & Motivations:**
- Have ingredients ready when needed
- Produce quality products consistently
- Minimize waste

**Frustrations & Pain Points:**
- Starts work and finds missing ingredients
- Doesn't know what quantity to produce
- No clear record of what was used

**Key Tasks:**
- Check available ingredients before production
- Report what was produced
- Flag ingredient issues

**Quote:** *"Just tell me we have enough flour before I start mixing at 4 AM."*

---

### Persona 4: The Sales Staff

| Attribute | Details |
|-----------|---------|
| **Name** | Mariama Sow |
| **Age** | 24 |
| **Location** | Conakry, Guinea |
| **Role** | Sales Attendant |
| **Technical Comfort** | Moderate - uses social media, comfortable with apps |

**Goals & Motivations:**
- Serve customers quickly
- Track sales accurately
- Avoid cash discrepancies

**Frustrations & Pain Points:**
- Remembering prices for all products
- Tracking different payment methods
- End-of-day cash counting

**Key Tasks:**
- Record sales transactions
- Track payment methods (cash, Orange Money)
- Report daily sales totals

**Quote:** *"I just want to tap and record, not calculate everything in my head."*

---

## 6. Empathy Maps

### Remote Owner - Amadou

| Says | Thinks |
|------|--------|
| "Send me the inventory count" | "Are they telling me the truth?" |
| "Why did we run out of sugar again?" | "I can't manage what I can't see" |
| "How much did we make this week?" | "Is this business even profitable?" |

| Does | Feels |
|------|-------|
| Calls manager at odd hours | Anxious about business health |
| Sends money via mobile transfer | Disconnected from daily operations |
| Reviews WhatsApp photos of receipts | Frustrated by lack of visibility |

---

### On-Site Manager - Fatoumata

| Says | Thinks |
|------|--------|
| "I'll check the stock tomorrow" | "There's too much to remember" |
| "We need to buy more butter" | "I hope the owner approves quickly" |
| "Sales were good today" | "I wish I had proof to show him" |

| Does | Feels |
|------|-------|
| Writes notes on paper | Overwhelmed by responsibilities |
| Takes photos of receipts | Wants to prove she's trustworthy |
| Calls suppliers when stock is low | Stressed about stockouts |

---

## 7. User Journey Maps

### Current Journey: Daily Inventory Check (Problematic)

```
Morning → Manager visually scans shelves → Guesses quantities →
Forgets to check some items → Production starts →
Discovers missing ingredient mid-production →
Production stops → Urgent call to supplier →
Expensive emergency purchase → Owner finds out later → Frustration
```

### Future Journey: Daily Inventory Check (With Bakery Hub)

```
Previous evening → System shows low stock alert →
SMS sent to Manager & Owner → Manager confirms stock →
Morning → Baker checks app, sees ingredient status →
Production proceeds smoothly →
Restock order placed on time → No surprises
```

---

## 8. Story Mapping

### Backbone (Major User Activities)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  1. INVENTORY   │  2. PRODUCTION  │    3. SALES     │   4. EXPENSES   │   5. DASHBOARD  │    6. ALERTS    │
│   MANAGEMENT    │    TRACKING     │    TRACKING     │   MANAGEMENT    │    & REPORTS    │  (Phase 2)      │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

---

### Activity 1: Inventory Management

**MVP Stories:**
- As a Manager, I want to add inventory items with name, category, unit, and minimum stock level
- As a Manager, I want to view all inventory items with current stock levels
- As a Manager, I want to adjust stock quantities (purchase, adjustment)
- As a Manager, I want to see items below minimum stock level highlighted
- As an Owner, I want to view inventory status from anywhere

**Future Stories:**
- As a Manager, I want to scan barcodes to add inventory items
- As an Owner, I want to see predicted stockout dates
- As a Manager, I want to receive restock recommendations

---

### Activity 2: Production Tracking

**MVP Stories:**
- As a Manager, I want to log daily production (product name, quantity)
- As a Manager, I want to record ingredient usage per production batch
- As a Manager, I want stock to auto-deduct when production is logged
- As an Owner, I want to see daily production reports

**Future Stories:**
- As a Manager, I want product recipes with standard ingredient amounts
- As an Owner, I want to see cost per product based on ingredients
- As a Baker, I want to view today's production plan

---

### Activity 3: Sales Tracking

**MVP Stories:**
- As a Manager, I want to record daily sales with total amount
- As a Manager, I want to break down sales by payment method (Cash, Orange Money, Card)
- As an Owner, I want to approve/reject sales submissions
- As an Owner, I want to see sales trends over time

**Future Stories:**
- As a Manager, I want to integrate with POS system (Loyverse)
- As a Manager, I want to track sales by product category
- As an Owner, I want to compare sales across time periods

---

### Activity 4: Expense Management

**MVP Stories:**
- As a Manager, I want to submit expenses with category, amount, and receipt photo
- As an Owner, I want to approve/reject expense submissions
- As a Manager, I want to link expenses to inventory purchases (auto-update stock)
- As an Owner, I want to see expenses by category

**Future Stories:**
- As an Owner, I want tiered approval (auto-approve below threshold)
- As a Manager, I want recurring expense templates
- As an Owner, I want supplier payment tracking

---

### Activity 5: Dashboard & Reports

**MVP Stories:**
- As an Owner, I want a dashboard showing key metrics (balance, revenue, expenses, profit)
- As an Owner, I want to see inventory alerts on the dashboard
- As an Owner, I want revenue and expense trend charts
- As a Manager, I want a simplified daily operations view

**Future Stories:**
- As an Owner, I want profitability analysis by product
- As an Owner, I want cash flow projections
- As an Owner, I want exportable reports (Excel)

---

### Activity 6: Alerts & Notifications (Phase 2)

**Future Stories:**
- As an Owner, I want SMS alerts for low stock items
- As an Owner, I want WhatsApp notifications for pending approvals
- As a Manager, I want push notifications for approved expenses
- As an Owner, I want daily summary SMS

---

## 9. MVP Definition

### In Scope (MVP - Must Have)

| Module | Features |
|--------|----------|
| **Authentication** | Google OAuth, email whitelist, Owner/Editor roles |
| **Inventory** | CRUD items, stock levels, categories, low stock alerts (in-app) |
| **Production** | Daily production log, ingredient usage, auto-deduct stock |
| **Sales** | Daily sales entry, payment method breakdown, approval workflow |
| **Expenses** | Submit/approve expenses, categories, receipt upload, link to inventory |
| **Dashboard** | KPIs, inventory alerts, revenue/expense trends |
| **i18n** | French (primary), English |
| **PWA** | Mobile-first, installable |

### Out of Scope (Phase 2+)

| Feature | Reason |
|---------|--------|
| SMS/WhatsApp notifications | Requires third-party integration, adds complexity |
| Barcode scanning | Hardware dependency |
| POS integration | Third-party API dependency |
| Recipe management | Nice-to-have, not core problem |
| Stockout predictions | Requires usage history data first |
| Offline mode | Complex sync logic, defer until needed |
| Multi-location support | Single bakery for now |

### Success Metrics

| Metric | Target |
|--------|--------|
| Owner can check inventory without calling staff | Yes/No |
| Daily sales recorded digitally | 90%+ compliance |
| Stockouts due to lack of visibility | Reduce by 50% |
| Time to approve expenses | < 24 hours |
| User adoption | All 4 staff roles using within 2 weeks |

### Risks & Assumptions

| Risk/Assumption | Mitigation |
|-----------------|------------|
| Staff may resist digital adoption | Simple UI, training, manager incentive |
| Internet connectivity in Guinea unreliable | PWA with graceful degradation |
| Owner timezone difference | Async workflows, no real-time requirements |
| Currency conversion rates fluctuate | Store in GNF, display EUR as reference only |

---

## 10. Feature Priority Matrix

### Impact vs Effort Analysis

```
                    HIGH IMPACT
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    │   QUICK WINS       │   MAJOR PROJECTS   │
    │                    │                    │
    │ • Low stock alerts │ • Production log   │
    │ • Inventory list   │ • Dashboard KPIs   │
    │ • Expense submit   │ • Expense-inventory│
    │ • Sales entry      │   link             │
    │                    │ • Approval workflow│
LOW ├────────────────────┼────────────────────┤ HIGH
EFFORT                   │                    EFFORT
    │   FILL-INS         │   MONEY PITS       │
    │                    │                    │
    │ • Profile page     │ • Barcode scanning │
    │ • Theme toggle     │ • POS integration  │
    │ • Receipt upload   │ • SMS notifications│
    │                    │ • Offline mode     │
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                    LOW IMPACT
```

### Prioritized Feature List

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| P0 | Authentication (Google OAuth + roles) | High | Low |
| P0 | Inventory CRUD with stock levels | High | Medium |
| P0 | Low stock alerts (in-app) | High | Low |
| P1 | Daily sales entry + approval | High | Medium |
| P1 | Expense submission + approval | High | Medium |
| P1 | Owner dashboard with KPIs | High | Medium |
| P2 | Production logging | High | High |
| P2 | Expense-to-inventory link | High | High |
| P2 | Revenue/expense trend charts | Medium | Medium |
| P3 | Receipt photo upload | Medium | Low |
| P3 | Excel export | Low | Low |
| P4 | SMS/WhatsApp alerts | High | High |
| P4 | Stockout predictions | Medium | High |

---

## 11. Technical Considerations

### Tech Stack (Same as O'Takos Reference)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 16+ (App Router) | Full-stack, proven in reference app |
| Language | TypeScript | Type safety, maintainability |
| Database | PostgreSQL + Prisma | Relational data, reference app patterns |
| Auth | NextAuth.js (Google OAuth) | Reference app patterns |
| Styling | Tailwind CSS | Reference design system |
| Charts | Recharts | Reference app patterns |
| PWA | next-pwa | Mobile-first requirement |

### Database Schema Additions (Beyond O'Takos)

```prisma
model InventoryItem {
  id           String   @id @default(uuid())
  name         String
  category     String   // Dry goods, Dairy, Packaging, etc.
  unit         String   // kg, L, pieces
  currentStock Float    @default(0)
  minStock     Float    @default(0)
  unitCostGNF  Float    @default(0)
  supplierId   String?
  isActive     Boolean  @default(true)
  stockMovements StockMovement[]
}

model StockMovement {
  id            String   @id @default(uuid())
  itemId        String
  item          InventoryItem @relation(fields: [itemId], references: [id])
  type          String   // purchase, usage, waste, adjustment
  quantity      Float    // positive for in, negative for out
  unitCost      Float?
  reason        String?
  productionLogId String?
  expenseId     String?
  createdBy     String
  createdAt     DateTime @default(now())
}

model ProductionLog {
  id          String   @id @default(uuid())
  date        DateTime
  productName String
  quantity    Int
  ingredients Json     // [{ itemId, quantity }]
  notes       String?
  createdBy   String
  createdAt   DateTime @default(now())
}
```

### Mobile & Connectivity Considerations

| Concern | Solution |
|---------|----------|
| Poor connectivity | PWA with service worker caching |
| Mobile-first | Tailwind responsive, touch-friendly buttons |
| Low-end devices | Minimal JavaScript, optimized images |
| Data costs | Efficient API payloads, pagination |

### Integration Points (Phase 2)

| Integration | Provider | Purpose |
|-------------|----------|---------|
| SMS | Twilio / Orange SMS API | Low stock alerts |
| WhatsApp | WhatsApp Business API | Notifications |
| POS | Loyverse API | Auto-import sales |

---

## 12. Implementation Roadmap

### Phase 1: Foundation
- Project setup (Next.js, Prisma, Tailwind)
- Authentication (Google OAuth, roles)
- Base UI layout and navigation
- i18n setup (French/English)

### Phase 2: Core Inventory
- Inventory item CRUD
- Stock level tracking
- Stock movements (manual adjustments)
- Low stock alerts (in-app)

### Phase 3: Sales & Expenses
- Daily sales entry and approval
- Expense submission and approval
- Category management
- Receipt upload

### Phase 4: Production & Integration
- Production logging
- Ingredient usage tracking
- Auto-deduct stock on production
- Link expenses to inventory purchases

### Phase 5: Dashboard & Reports
- Owner dashboard with KPIs
- Manager operations view
- Trend charts
- Inventory status widgets

### Phase 6: Polish & Launch
- PWA configuration
- Performance optimization
- User testing
- Documentation

### Future Phases
- SMS/WhatsApp notifications
- Stockout predictions
- POS integration
- Offline mode
