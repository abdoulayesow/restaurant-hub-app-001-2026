# Product Discovery Prompt for Bakery Inventory Management Application

> **Purpose**: Use this prompt with Claude to conduct product discovery and create a comprehensive product vision, personas, empathy maps, and story mapping before building the bakery application.

---

## The Prompt

Copy and paste the following prompt into a new Claude conversation:

---

```
# Product Discovery Session: Bakery Inventory & Expense Management Application

I'm building a web application for a bakery in Guinea (French-speaking West Africa), managed remotely by the owner who lives in Atlanta, USA. The bakery has a major challenge: **inventory management**. The owner struggles to track inventory levels, know when to restock, and monitor expenses.

I want to conduct a full product discovery session to define the product vision, understand user needs, and plan the MVP before building.

## Context

### Similar Reference Application
I have an existing restaurant dashboard application (O'Takos) that handles:
- Daily sales tracking (manual entry + POS integration)
- Expense management with approval workflows
- Cash flow & bank deposit management
- Multi-currency support (GNF primary, EUR secondary)
- Role-based access (Manager/Editor)
- French/English bilingual support
- Mobile-first PWA

### Key Difference for Bakery App
The bakery application needs **strong inventory management** as its core differentiator:
- Track ingredient stock levels (flour, sugar, eggs, butter, etc.)
- Set minimum stock thresholds with alerts
- Track daily ingredient usage per product
- Generate restock recommendations
- Connect inventory to expenses (when buying supplies)
- Predict when ingredients will run out based on usage patterns

### Business Context
- **Location**: Guinea (Conakry)
- **Owner Location**: Atlanta, USA (remote management)
- **Currency**: GNF (Guinean Franc), EUR for reference
- **Language**: French (primary), English (secondary)
- **Staff**: On-site manager, bakers, sales staff
- **Pain Points**:
  - Owner can't see real-time inventory from Atlanta
  - Staff doesn't consistently track ingredient usage
  - Running out of key ingredients causes production stops
  - No visibility into which products are most profitable
  - Expenses not categorized properly

---

## Product Discovery Tasks

Please help me work through these product discovery activities:

### 1. Product Vision Statement
Create a compelling product vision statement following the format:
- FOR [target customer]
- WHO [statement of need]
- THE [product name] IS A [product category]
- THAT [key benefit, reason to buy]
- UNLIKE [primary competitive alternative]
- OUR PRODUCT [statement of primary differentiation]

### 2. User Personas
Create 3-4 detailed personas:
- **The Remote Owner** (in Atlanta)
- **The On-Site Manager** (in Guinea)
- **The Baker/Production Staff**
- (Optional) **The Sales Staff**

For each persona include:
- Name, age, location, role
- Goals and motivations
- Frustrations and pain points
- Technical comfort level
- Key tasks they need to accomplish
- Quote that captures their mindset

### 3. Empathy Maps
For each key persona, create an empathy map covering:
- **Says**: Quotes and statements they make
- **Thinks**: What they're thinking but might not say
- **Does**: Actions and behaviors
- **Feels**: Emotional state, concerns, hopes

### 4. User Journey Map
Map the current (problematic) journey vs the desired future journey for:
- Daily inventory tracking workflow
- Restocking decision workflow
- Expense tracking workflow
- Remote monitoring workflow (for owner)

### 5. Story Mapping
Create a user story map with:
- **Backbone** (major user activities in sequence)
- **Walking Skeleton** (minimum features for each activity)
- **MVP Release** (first release features)
- **Future Releases** (nice-to-have features)

Structure as:
```
Activity 1: [Name]
├── MVP Stories
│   ├── As a [user], I want to [action] so that [benefit]
│   └── ...
└── Future Stories
    └── ...
```

### 6. MVP Definition
Based on the story mapping, define:
- **In Scope** (MVP features - must have)
- **Out of Scope** (future features - nice to have)
- **Success Metrics** (how we'll know MVP is successful)
- **Risks & Assumptions** to validate

### 7. Feature Priority Matrix
Create a 2x2 matrix (Impact vs Effort) for top 15 features:
- **Quick Wins** (High Impact, Low Effort)
- **Major Projects** (High Impact, High Effort)
- **Fill-Ins** (Low Impact, Low Effort)
- **Money Pits** (Low Impact, High Effort)

### 8. Technical Considerations
Based on the reference application, recommend:
- Tech stack decisions (keep same as reference or change?)
- Database schema considerations for inventory
- Mobile-first priorities
- Offline capability needs (Guinea may have connectivity issues)
- Integration opportunities (WhatsApp notifications, SMS alerts)

---

## Deliverables Expected

After this discovery session, I should have:
1. Clear product vision document
2. Detailed persona profiles
3. Empathy maps for key users
4. Current vs future journey maps
5. Prioritized user story map
6. Well-defined MVP scope
7. Feature priority matrix
8. Technical recommendations

Please work through each section thoroughly, asking clarifying questions if needed. Let's start with the Product Vision Statement.
```

---

## How to Use This Prompt

1. **Start a new Claude conversation**
2. **Copy the entire prompt above** (between the triple backticks)
3. **Paste it into Claude**
4. **Work through each section** - Claude will guide you through the discovery process
5. **Save the outputs** - Create a `PRODUCT-VISION.md` document with all the artifacts
6. **Iterate** - Use the outputs to refine and validate with stakeholders

---

## Additional Prompts for Follow-Up

### Prompt: Create Technical Specification

After completing product discovery, use this prompt:

```
Based on our product discovery session, please create a technical specification document that includes:

1. System Architecture Diagram
2. Database Schema (Prisma format)
3. API Endpoints List
4. Component Hierarchy
5. State Management Approach
6. Authentication & Authorization Plan
7. Internationalization Strategy
8. PWA & Offline Considerations
9. Deployment Architecture
10. Testing Strategy

Use the O'Takos reference application architecture as a baseline, adapting for inventory management needs.
```

### Prompt: Create UI/UX Wireframes Description

```
Based on our personas and user journeys, please describe wireframes for these key screens:

1. Dashboard (Owner view - remote monitoring)
2. Dashboard (Manager view - daily operations)
3. Inventory List with Stock Levels
4. Add/Edit Inventory Item
5. Low Stock Alerts
6. Daily Production Log (ingredient usage)
7. Expense Entry (linked to inventory purchase)
8. Restock Recommendations
9. Mobile Navigation

For each screen, describe:
- Key information displayed
- Primary actions available
- Layout structure (header, cards, lists, etc.)
- Mobile vs desktop differences
```

### Prompt: Create Implementation Roadmap

```
Based on our MVP definition and feature priority matrix, create a phased implementation roadmap:

Phase 1: Foundation (Week 1-2)
Phase 2: Core Inventory (Week 3-4)
Phase 3: Expense Integration (Week 5-6)
Phase 4: Analytics & Alerts (Week 7-8)
Phase 5: Polish & Launch (Week 9-10)

For each phase, specify:
- Features to implement
- Database migrations needed
- API endpoints to create
- Components to build
- Testing requirements
- Deployment milestones
```

---

## Notes on Inventory Management Features

Based on the bakery context, here are key inventory features to consider:

### Ingredient Categories
- Dry goods (flour, sugar, salt, baking powder)
- Dairy (butter, milk, cream, eggs)
- Flavorings (vanilla, chocolate, fruits)
- Packaging (boxes, bags, ribbons)
- Utilities (gas, cleaning supplies)

### Measurement Units
- Weight: kg, g
- Volume: L, mL
- Count: pieces, dozen
- Package: bags, boxes

### Key Metrics to Track
- Current stock level
- Minimum stock threshold
- Reorder point
- Average daily usage
- Days until stockout (projection)
- Cost per unit
- Supplier information

### Inventory Events
- Purchase/Restock (increases quantity)
- Production usage (decreases quantity)
- Waste/Spoilage (decreases quantity)
- Inventory adjustment (correction)
- Transfer between locations

### Alerts System
- Low stock alert (below minimum)
- Critical stock alert (near zero)
- Expiry warning (for perishables)
- Price change notification
- Restock reminder

### Reports
- Inventory valuation (total stock value)
- Usage trends by ingredient
- Waste/spoilage report
- Cost analysis by product
- Supplier spending breakdown

---

## Sample Product Vision (For Reference)

Here's an example of what the product vision might look like:

```
FOR bakery owners and managers in West Africa
WHO need to track inventory, manage expenses, and operate their business remotely
THE Bakery Hub IS A cloud-based bakery management platform
THAT provides real-time inventory visibility, automated restock alerts, and integrated expense tracking
UNLIKE spreadsheets and manual tracking methods
OUR PRODUCT offers mobile-first access, offline capability, and intelligent predictions that prevent production stops due to ingredient shortages.
```

---

**Use these prompts to conduct thorough product discovery before building. This investment upfront will save significant development time and ensure you build the right product.**
