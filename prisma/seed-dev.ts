/**
 * Development Database Seeding Script
 *
 * This script clears and recreates business data for the first restaurant only.
 * It preserves restaurants, users, products, inventory items, and categories.
 *
 * Usage: npx ts-node prisma/seed-dev.ts
 * Or: npm run seed:dev
 */

import {
  PrismaClient,
  ProductionStatus,
  SubmissionStatus,
  ProductCategory,
  DebtStatus,
  BankTransactionType,
  BankPaymentMethod,
  TransactionReason,
  BankTransactionStatus,
  PaymentStatus,
  CustomerType,
} from '@prisma/client'

const prisma = new PrismaClient()

// Constants
const RESTAURANT_ID = 'bliss-miniere'
const START_DATE = new Date(Date.UTC(2026, 0, 1)) // Jan 1, 2026
const END_DATE = new Date(Date.UTC(2026, 1, 15)) // Feb 15, 2026
// Total days from Jan 1 to Feb 15 inclusive = 46
const TOTAL_DAYS = 46

// Helper to round to 100,000 GNF
function roundTo100k(amount: number): number {
  return Math.round(amount / 100000) * 100000
}

// Helper to get a date by offset from START_DATE (1-indexed: day 1 = Jan 1)
function getDate(dayOffset: number): Date {
  const d = new Date(Date.UTC(2026, 0, dayOffset, 12, 0, 0))
  return d
}

// Helper to get a YYYY-MM-DD date key for use in IDs
function getDateKey(dayOffset: number): string {
  const d = getDate(dayOffset)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// Helper to get display label for a date (e.g., "Jan 15" or "Feb 3")
function getDateLabel(dayOffset: number): string {
  const d = getDate(dayOffset)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`
}

// Helper to check if a day is weekend (Saturday = 6, Sunday = 0)
function isWeekend(dayOffset: number): boolean {
  const date = getDate(dayOffset)
  const dayOfWeek = date.getUTCDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

// Helper for random variation (returns value rounded to 100k)
function varyAmount(base: number, percentageRange: number = 15): number {
  const variation = 1 + (Math.random() * 2 - 1) * (percentageRange / 100)
  return roundTo100k(base * variation)
}

// Helper for random integer in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ============================================================================
// PHASE 1: CLEAR BUSINESS DATA
// ============================================================================
async function clearBusinessData() {
  console.log('Phase 1: Clearing existing business data...')

  // Delete in correct order to respect FK constraints
  // Must delete in reverse dependency order

  // 1. Bank transactions (linked to sales, debtPayments, expensePayments)
  const bankTxCount = await prisma.bankTransaction.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${bankTxCount.count} bank transactions`)

  // 2. Debt payments (linked to debts, customers, bank transactions)
  const debtPaymentCount = await prisma.debtPayment.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${debtPaymentCount.count} debt payments`)

  // 3. Debts (linked to sales, customers)
  const debtCount = await prisma.debt.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${debtCount.count} debts`)

  // 4. Sale items (linked to sales)
  const saleItemCount = await prisma.saleItem.deleteMany({
    where: { sale: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  Deleted ${saleItemCount.count} sale items`)

  // 5. Sales
  const saleCount = await prisma.sale.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${saleCount.count} sales`)

  // 6. Expense payments (linked to expenses)
  const expPaymentCount = await prisma.expensePayment.deleteMany({
    where: { expense: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  Deleted ${expPaymentCount.count} expense payments`)

  // 7. Expense items (linked to expenses, inventory)
  const expItemCount = await prisma.expenseItem.deleteMany({
    where: { expense: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  Deleted ${expItemCount.count} expense items`)

  // 8. Stock movements (linked to expenses, production logs)
  const stockMovCount = await prisma.stockMovement.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${stockMovCount.count} stock movements`)

  // 9. Expenses
  const expenseCount = await prisma.expense.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${expenseCount.count} expenses`)

  // 10. Production items (linked to production logs)
  const prodItemCount = await prisma.productionItem.deleteMany({
    where: { productionLog: { restaurantId: RESTAURANT_ID } }
  })
  console.log(`  Deleted ${prodItemCount.count} production items`)

  // 11. Production logs
  const prodLogCount = await prisma.productionLog.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${prodLogCount.count} production logs`)

  // 12. Customers (we'll recreate them)
  const customerCount = await prisma.customer.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${customerCount.count} customers`)

  // 13. Daily summaries
  const summaryCount = await prisma.dailySummary.deleteMany({
    where: { restaurantId: RESTAURANT_ID }
  })
  console.log(`  Deleted ${summaryCount.count} daily summaries`)

  console.log('  Business data cleared successfully!')
}

// ============================================================================
// PHASE 2: FETCH OR CREATE REQUIRED REFERENCES
// ============================================================================
async function fetchOrCreateReferences() {
  console.log('Phase 2: Fetching/creating required references...')

  // Get restaurant
  let restaurant = await prisma.restaurant.findUnique({
    where: { id: RESTAURANT_ID }
  })
  if (!restaurant) {
    console.log('  Creating restaurant...')
    restaurant = await prisma.restaurant.create({
      data: {
        id: RESTAURANT_ID,
        name: 'Bliss Minière',
        location: 'Conakry - Minière',
        currency: 'GNF',
        restaurantType: 'Bakery',
        initialCapital: 50000000,
        initialCashBalance: 5000000,
        initialOrangeBalance: 2000000,
        initialCardBalance: 1000000,
        contactPhone: '+224 620 10 00 01',
        managerName: 'Aminata Camara',
        trackingStartDate: new Date('2026-01-01'),
        isActive: true,
      }
    })
  }
  console.log(`  Restaurant: ${restaurant.name}`)

  // Get owner user
  let ownerUser = await prisma.user.findFirst({
    where: {
      restaurants: {
        some: {
          restaurantId: RESTAURANT_ID,
          role: 'Owner'
        }
      }
    }
  })
  if (!ownerUser) {
    // Try to find any owner user
    ownerUser = await prisma.user.findFirst({
      where: { role: 'Owner' }
    })
    if (!ownerUser) {
      console.log('  Creating owner user...')
      ownerUser = await prisma.user.create({
        data: {
          email: 'owner@bakery-dev.local',
          name: 'Dev Owner',
          role: 'Owner',
          defaultRestaurantId: RESTAURANT_ID,
        }
      })
    }
    // Assign to restaurant
    await prisma.userRestaurant.upsert({
      where: {
        userId_restaurantId: {
          userId: ownerUser.id,
          restaurantId: RESTAURANT_ID,
        }
      },
      update: { role: 'Owner' },
      create: {
        userId: ownerUser.id,
        restaurantId: RESTAURANT_ID,
        role: 'Owner',
      }
    })
  }
  console.log(`  Owner: ${ownerUser.name || ownerUser.email}`)

  // Get or create products
  let products = await prisma.product.findMany({
    where: { restaurantId: RESTAURANT_ID, isActive: true }
  })
  if (products.length === 0) {
    console.log('  Creating products...')
    const productsTemplate = [
      { name: 'Croissant', nameFr: 'Croissant', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 1 },
      { name: 'Pain au Chocolat', nameFr: 'Pain au Chocolat', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 2 },
      { name: 'Eclair', nameFr: 'Éclair', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 3 },
      { name: 'Brioche', nameFr: 'Brioche', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 4 },
      { name: 'Baguette', nameFr: 'Baguette', category: ProductCategory.Boulangerie, unit: 'piece', sortOrder: 1 },
      { name: 'Sandwich Bread', nameFr: 'Pain de Mie', category: ProductCategory.Boulangerie, unit: 'loaf', sortOrder: 2 },
      { name: 'Petit Pain', nameFr: 'Petit Pain', category: ProductCategory.Boulangerie, unit: 'piece', sortOrder: 3 },
      { name: 'Country Bread', nameFr: 'Pain de Campagne', category: ProductCategory.Boulangerie, unit: 'loaf', sortOrder: 4 },
    ]
    for (let i = 0; i < productsTemplate.length; i++) {
      const p = productsTemplate[i]
      await prisma.product.create({
        data: {
          id: `prod-dev-${String(i + 1).padStart(2, '0')}`,
          restaurantId: RESTAURANT_ID,
          name: p.name,
          nameFr: p.nameFr,
          category: p.category,
          unit: p.unit,
          sortOrder: p.sortOrder,
          isActive: true,
        }
      })
    }
    products = await prisma.product.findMany({
      where: { restaurantId: RESTAURANT_ID, isActive: true }
    })
  }
  console.log(`  Products: ${products.length}`)

  // Get or create inventory items
  let inventoryItems = await prisma.inventoryItem.findMany({
    where: { restaurantId: RESTAURANT_ID, isActive: true }
  })
  if (inventoryItems.length === 0) {
    console.log('  Creating inventory items...')
    const inventoryTemplate = [
      { name: 'Wheat Flour', nameFr: 'Farine de blé', category: 'dry_goods', unit: 'kg', currentStock: 300, minStock: 50, reorderPoint: 100, unitCostGNF: 8000 },
      { name: 'Sugar', nameFr: 'Sucre', category: 'dry_goods', unit: 'kg', currentStock: 150, minStock: 30, reorderPoint: 60, unitCostGNF: 6000 },
      { name: 'Yeast', nameFr: 'Levure', category: 'dry_goods', unit: 'kg', currentStock: 20, minStock: 5, reorderPoint: 10, unitCostGNF: 25000 },
      { name: 'Salt', nameFr: 'Sel', category: 'dry_goods', unit: 'kg', currentStock: 30, minStock: 10, reorderPoint: 15, unitCostGNF: 2000 },
      { name: 'Butter', nameFr: 'Beurre', category: 'dairy', unit: 'kg', currentStock: 80, minStock: 20, reorderPoint: 40, unitCostGNF: 35000 },
      { name: 'Milk', nameFr: 'Lait', category: 'dairy', unit: 'L', currentStock: 50, minStock: 15, reorderPoint: 30, unitCostGNF: 12000 },
      { name: 'Eggs', nameFr: 'Oeufs', category: 'dairy', unit: 'unit', currentStock: 200, minStock: 50, reorderPoint: 100, unitCostGNF: 1500 },
      { name: 'Vanilla Extract', nameFr: 'Extrait de Vanille', category: 'flavorings', unit: 'L', currentStock: 5, minStock: 2, reorderPoint: 3, unitCostGNF: 80000 },
      { name: 'Chocolate', nameFr: 'Chocolat', category: 'flavorings', unit: 'kg', currentStock: 15, minStock: 5, reorderPoint: 10, unitCostGNF: 45000 },
      { name: 'Pastry Boxes', nameFr: 'Boîtes à pâtisserie', category: 'packaging', unit: 'unit', currentStock: 300, minStock: 100, reorderPoint: 150, unitCostGNF: 500 },
    ]
    for (let i = 0; i < inventoryTemplate.length; i++) {
      const item = inventoryTemplate[i]
      await prisma.inventoryItem.create({
        data: {
          id: `inv-dev-${String(i + 1).padStart(2, '0')}`,
          restaurantId: RESTAURANT_ID,
          ...item,
        }
      })
    }
    inventoryItems = await prisma.inventoryItem.findMany({
      where: { restaurantId: RESTAURANT_ID, isActive: true }
    })
  }
  console.log(`  Inventory items: ${inventoryItems.length}`)

  // Get or create categories
  let categories = await prisma.category.findMany({
    where: { isActive: true }
  })
  if (categories.length === 0) {
    console.log('  Creating expense categories...')
    const categoriesData = [
      { name: 'Flour', nameFr: 'Farine', color: '#22c55e' },
      { name: 'Electricity', nameFr: 'Électricité', color: '#3b82f6' },
      { name: 'Staff Salaries', nameFr: 'Salaires du personnel', color: '#a855f7' },
      { name: 'Packaging', nameFr: 'Emballages', color: '#f97316' },
    ]
    for (const cat of categoriesData) {
      await prisma.category.create({
        data: {
          name: cat.name,
          nameFr: cat.nameFr,
          color: cat.color,
          isActive: true,
        }
      })
    }
    categories = await prisma.category.findMany({
      where: { isActive: true }
    })
  }
  console.log(`  Categories: ${categories.length}`)

  return { restaurant, ownerUser, products, inventoryItems, categories }
}

// ============================================================================
// PHASE 3: CREATE CUSTOMERS
// ============================================================================
async function createCustomers() {
  console.log('Phase 3: Creating 5 customers...')

  const customersData = [
    {
      id: `cust-dev-${RESTAURANT_ID}-01`,
      name: 'Mamadou Diallo',
      phone: '+224 620 001 001',
      email: 'mamadou.diallo@email.gn',
      customerType: CustomerType.Individual,
      creditLimit: 500000,
      company: null,
    },
    {
      id: `cust-dev-${RESTAURANT_ID}-02`,
      name: 'Fatou Camara',
      phone: '+224 620 001 002',
      email: 'fatou.camara@email.gn',
      customerType: CustomerType.Individual,
      creditLimit: 300000,
      company: null,
    },
    {
      id: `cust-dev-${RESTAURANT_ID}-03`,
      name: 'Hotel Riviera',
      phone: '+224 620 001 003',
      email: 'commandes@hotelriviera.gn',
      customerType: CustomerType.Corporate,
      creditLimit: 2000000,
      company: 'Hotel Riviera Conakry',
    },
    {
      id: `cust-dev-${RESTAURANT_ID}-04`,
      name: 'Restaurant Le Maquis',
      phone: '+224 620 001 004',
      email: 'chef@lemaquis.gn',
      customerType: CustomerType.Corporate,
      creditLimit: 1500000,
      company: 'Le Maquis SARL',
    },
    {
      id: `cust-dev-${RESTAURANT_ID}-05`,
      name: 'Boutique Chez Aissatou',
      phone: '+224 620 001 005',
      email: 'aissatou@boutique.gn',
      customerType: CustomerType.Wholesale,
      creditLimit: 1000000,
      company: 'Chez Aissatou',
    },
  ]

  const customers = []
  for (const cust of customersData) {
    const customer = await prisma.customer.create({
      data: {
        id: cust.id,
        restaurantId: RESTAURANT_ID,
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        customerType: cust.customerType,
        creditLimit: cust.creditLimit,
        company: cust.company,
        isActive: true,
      }
    })
    customers.push(customer)
    console.log(`  Created: ${customer.name} (${customer.customerType})`)
  }

  return customers
}

// ============================================================================
// PHASE 4: CREATE DAILY SALES (Jan 1-28)
// ============================================================================
async function createDailySales(
  ownerId: string,
  ownerName: string | null,
  products: Array<{ id: string; name: string; category: ProductCategory }>
) {
  console.log(`Phase 4: Creating daily sales (Jan 1 - Feb 15, ${TOTAL_DAYS} days)...`)

  const sales = []
  const saleItems = []
  const bankTransactions = []

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const date = getDate(day)
    const dateKey = getDateKey(day)
    const dateLabel = getDateLabel(day)
    const isWknd = isWeekend(day)

    // Base sales: 2.5M weekday, 3.5M weekend
    // Add slight upward trend in February (~10% growth)
    const trendMultiplier = day > 31 ? 1.10 : 1.0
    const baseSales = (isWknd ? 3500000 : 2500000) * trendMultiplier
    const totalGNF = varyAmount(baseSales, 15)

    // Payment split: 60% cash, 25% mobile, 15% card
    const cashGNF = roundTo100k(totalGNF * 0.60)
    const orangeMoneyGNF = roundTo100k(totalGNF * 0.25)
    const cardGNF = totalGNF - cashGNF - orangeMoneyGNF

    const saleId = `sale-dev-${RESTAURANT_ID}-${dateKey}`

    // Create sale
    const sale = await prisma.sale.create({
      data: {
        id: saleId,
        restaurantId: RESTAURANT_ID,
        date: date,
        totalGNF: totalGNF,
        cashGNF: cashGNF,
        orangeMoneyGNF: orangeMoneyGNF,
        cardGNF: cardGNF,
        itemsCount: randomInt(isWknd ? 400 : 300, isWknd ? 500 : 400),
        customersCount: randomInt(isWknd ? 120 : 90, isWknd ? 180 : 140),
        status: SubmissionStatus.Approved,
        submittedBy: ownerId,
        submittedByName: ownerName,
        approvedBy: ownerId,
        approvedByName: ownerName,
        approvedAt: date,
      }
    })
    sales.push(sale)

    // Create 5 sale items per day (random products)
    const shuffledProducts = [...products].sort(() => Math.random() - 0.5).slice(0, 5)
    for (const product of shuffledProducts) {
      const saleItem = await prisma.saleItem.create({
        data: {
          saleId: saleId,
          productId: product.id,
          productName: product.name,
          quantity: randomInt(20, 80),
          unitPrice: roundTo100k(randomInt(2000, 10000)),
        }
      })
      saleItems.push(saleItem)
    }

    // Create bank transactions for each payment method (sales deposit)
    // Cash deposit
    if (cashGNF > 0) {
      const bankTxCash = await prisma.bankTransaction.create({
        data: {
          id: `bank-sale-cash-${dateKey}`,
          restaurantId: RESTAURANT_ID,
          date: date,
          amount: cashGNF,
          type: BankTransactionType.Deposit,
          method: BankPaymentMethod.Cash,
          reason: TransactionReason.SalesDeposit,
          saleId: saleId,
          description: `Daily sales deposit (Cash) - ${dateLabel}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `DEP-CASH-${dateKey}`,
          createdBy: ownerId,
          createdByName: ownerName,
        }
      })
      bankTransactions.push(bankTxCash)
    }

    // Orange Money deposit
    if (orangeMoneyGNF > 0) {
      const bankTxOrange = await prisma.bankTransaction.create({
        data: {
          id: `bank-sale-orange-${dateKey}`,
          restaurantId: RESTAURANT_ID,
          date: date,
          amount: orangeMoneyGNF,
          type: BankTransactionType.Deposit,
          method: BankPaymentMethod.OrangeMoney,
          reason: TransactionReason.SalesDeposit,
          saleId: saleId,
          description: `Daily sales deposit (Orange Money) - ${dateLabel}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `DEP-OM-${dateKey}`,
          createdBy: ownerId,
          createdByName: ownerName,
        }
      })
      bankTransactions.push(bankTxOrange)
    }

    // Card deposit
    if (cardGNF > 0) {
      const bankTxCard = await prisma.bankTransaction.create({
        data: {
          id: `bank-sale-card-${dateKey}`,
          restaurantId: RESTAURANT_ID,
          date: date,
          amount: cardGNF,
          type: BankTransactionType.Deposit,
          method: BankPaymentMethod.Card,
          reason: TransactionReason.SalesDeposit,
          saleId: saleId,
          description: `Daily sales deposit (Card) - ${dateLabel}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `DEP-CARD-${dateKey}`,
          createdBy: ownerId,
          createdByName: ownerName,
        }
      })
      bankTransactions.push(bankTxCard)
    }

    if (day % 7 === 0) {
      console.log(`  Week ${day / 7}: Created ${day} sales`)
    }
  }

  console.log(`  Created ${sales.length} sales, ${saleItems.length} sale items, ${bankTransactions.length} bank transactions`)
  return { sales, saleItems, bankTransactions }
}

// ============================================================================
// PHASE 5: CREATE EXPENSES
// ============================================================================
async function createExpenses(
  ownerId: string,
  ownerName: string | null,
  categories: Array<{ id: string; name: string }>,
  inventoryItems: Array<{ id: string; name: string; unitCostGNF: number }>
) {
  console.log('Phase 5: Creating expenses...')

  const expenses = []
  const expensePayments = []
  const bankTransactions = []
  const stockMovements = []

  // Find specific categories
  const flourCat = categories.find(c => c.name === 'Flour')
  const electricityCat = categories.find(c => c.name === 'Electricity')
  const salariesCat = categories.find(c => c.name === 'Staff Salaries')
  const packagingCat = categories.find(c => c.name === 'Packaging')
  const flourItem = inventoryItems.find(i => i.name === 'Wheat Flour')

  // Inventory purchases every 2 days (days 2, 4, 6, ... TOTAL_DAYS)
  for (let day = 2; day <= TOTAL_DAYS; day += 2) {
    const date = getDate(day)
    const dateKey = getDateKey(day)
    const dateLabel = getDateLabel(day)
    const amount = varyAmount(2000000, 25) // 1.5M - 2.5M
    const expId = `exp-inv-${dateKey}`
    const bankTxId = `bank-exp-inv-${dateKey}`
    const expPayId = `exp-pay-inv-${dateKey}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: flourCat?.id,
        categoryName: 'Flour',
        amountGNF: amount,
        paymentMethod: 'Cash',
        description: `Inventory restock - ${dateLabel}`,
        isInventoryPurchase: true,
        paymentStatus: PaymentStatus.Paid,
        totalPaidAmount: amount,
        fullyPaidAt: date,
      }
    })
    expenses.push(expense)

    // Bank transaction (withdrawal)
    const bankTx = await prisma.bankTransaction.create({
      data: {
        id: bankTxId,
        restaurantId: RESTAURANT_ID,
        date: date,
        amount: amount,
        type: BankTransactionType.Withdrawal,
        method: BankPaymentMethod.Cash,
        reason: TransactionReason.ExpensePayment,
        description: `Inventory purchase - ${dateLabel}`,
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-INV-${dateKey}`,
        createdBy: ownerId,
        createdByName: ownerName,
      }
    })
    bankTransactions.push(bankTx)

    // Expense payment
    const expPay = await prisma.expensePayment.create({
      data: {
        id: expPayId,
        expenseId: expId,
        amount: amount,
        paymentMethod: BankPaymentMethod.Cash,
        paidAt: date,
        bankTransactionId: bankTxId,
        paidBy: ownerId,
        paidByName: ownerName,
      }
    })
    expensePayments.push(expPay)

    // Stock movement for purchase
    if (flourItem) {
      const qty = Math.round(amount / flourItem.unitCostGNF)
      const stockMov = await prisma.stockMovement.create({
        data: {
          id: `mov-purchase-${dateKey}`,
          restaurantId: RESTAURANT_ID,
          itemId: flourItem.id,
          type: 'Purchase',
          quantity: qty,
          unitCost: flourItem.unitCostGNF,
          reason: `Inventory restock - ${dateLabel}`,
          expenseId: expId,
          createdBy: ownerId,
          createdByName: ownerName,
          createdAt: date,
        }
      })
      stockMovements.push(stockMov)
    }
  }
  console.log(`  Created ${expenses.length} inventory expenses`)

  // Weekly utilities (every 7 days)
  for (const day of [7, 14, 21, 28, 35, 42]) {
    const date = getDate(day)
    const dateKey = getDateKey(day)
    const dateLabel = getDateLabel(day)
    const weekNum = Math.ceil(day / 7)
    const amount = varyAmount(600000, 20) // 500K - 700K
    const expId = `exp-util-${dateKey}`
    const bankTxId = `bank-util-${dateKey}`
    const expPayId = `exp-pay-util-${dateKey}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: electricityCat?.id,
        categoryName: 'Electricity',
        amountGNF: amount,
        paymentMethod: 'Orange Money',
        description: `Weekly utilities - Week ${weekNum}`,
        isInventoryPurchase: false,
        paymentStatus: PaymentStatus.Paid,
        totalPaidAmount: amount,
        fullyPaidAt: date,
      }
    })
    expenses.push(expense)

    const bankTx = await prisma.bankTransaction.create({
      data: {
        id: bankTxId,
        restaurantId: RESTAURANT_ID,
        date: date,
        amount: amount,
        type: BankTransactionType.Withdrawal,
        method: BankPaymentMethod.OrangeMoney,
        reason: TransactionReason.ExpensePayment,
        description: `Utilities - Week ${weekNum}`,
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-UTL-${dateKey}`,
        createdBy: ownerId,
        createdByName: ownerName,
      }
    })
    bankTransactions.push(bankTx)

    const expPay = await prisma.expensePayment.create({
      data: {
        id: expPayId,
        expenseId: expId,
        amount: amount,
        paymentMethod: BankPaymentMethod.OrangeMoney,
        paidAt: date,
        bankTransactionId: bankTxId,
        paidBy: ownerId,
        paidByName: ownerName,
      }
    })
    expensePayments.push(expPay)
  }
  console.log(`  Created 6 utility expenses`)

  // Bi-monthly salaries (days 15, 28, 46 = Jan 15, Jan 28, Feb 15)
  for (const day of [15, 28, 46]) {
    const date = getDate(day)
    const dateKey = getDateKey(day)
    const dateLabel = getDateLabel(day)
    const amount = varyAmount(3500000, 10) // 3.2M - 3.8M
    const expId = `exp-sal-${dateKey}`
    const bankTxId = `bank-sal-${dateKey}`
    const expPayId = `exp-pay-sal-${dateKey}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: salariesCat?.id,
        categoryName: 'Staff Salaries',
        amountGNF: amount,
        paymentMethod: 'Cash',
        description: `Salaries - ${dateLabel}`,
        isInventoryPurchase: false,
        paymentStatus: PaymentStatus.Paid,
        totalPaidAmount: amount,
        fullyPaidAt: date,
      }
    })
    expenses.push(expense)

    const bankTx = await prisma.bankTransaction.create({
      data: {
        id: bankTxId,
        restaurantId: RESTAURANT_ID,
        date: date,
        amount: amount,
        type: BankTransactionType.Withdrawal,
        method: BankPaymentMethod.Cash,
        reason: TransactionReason.ExpensePayment,
        description: `Salaries - ${dateLabel}`,
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-SAL-${dateKey}`,
        createdBy: ownerId,
        createdByName: ownerName,
      }
    })
    bankTransactions.push(bankTx)

    const expPay = await prisma.expensePayment.create({
      data: {
        id: expPayId,
        expenseId: expId,
        amount: amount,
        paymentMethod: BankPaymentMethod.Cash,
        paidAt: date,
        bankTransactionId: bankTxId,
        paidBy: ownerId,
        paidByName: ownerName,
      }
    })
    expensePayments.push(expPay)
  }
  console.log(`  Created 3 salary expenses`)

  // Weekly supplies
  for (const day of [5, 12, 19, 26, 33, 40]) {
    const date = getDate(day)
    const dateKey = getDateKey(day)
    const dateLabel = getDateLabel(day)
    const weekNum = Math.ceil(day / 7)
    const amount = varyAmount(400000, 30) // 300K - 500K
    const expId = `exp-sup-${dateKey}`
    const bankTxId = `bank-sup-${dateKey}`
    const expPayId = `exp-pay-sup-${dateKey}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: packagingCat?.id,
        categoryName: 'Packaging',
        amountGNF: amount,
        paymentMethod: 'Card',
        description: `Supplies purchase - Week ${weekNum}`,
        isInventoryPurchase: false,
        paymentStatus: PaymentStatus.Paid,
        totalPaidAmount: amount,
        fullyPaidAt: date,
      }
    })
    expenses.push(expense)

    const bankTx = await prisma.bankTransaction.create({
      data: {
        id: bankTxId,
        restaurantId: RESTAURANT_ID,
        date: date,
        amount: amount,
        type: BankTransactionType.Withdrawal,
        method: BankPaymentMethod.Card,
        reason: TransactionReason.ExpensePayment,
        description: `Supplies - Week ${weekNum}`,
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-SUP-${dateKey}`,
        createdBy: ownerId,
        createdByName: ownerName,
      }
    })
    bankTransactions.push(bankTx)

    const expPay = await prisma.expensePayment.create({
      data: {
        id: expPayId,
        expenseId: expId,
        amount: amount,
        paymentMethod: BankPaymentMethod.Card,
        paidAt: date,
        bankTransactionId: bankTxId,
        paidBy: ownerId,
        paidByName: ownerName,
      }
    })
    expensePayments.push(expPay)
  }
  console.log(`  Created 6 supply expenses`)

  console.log(`  Total: ${expenses.length} expenses, ${expensePayments.length} payments, ${bankTransactions.length} bank transactions`)
  return { expenses, expensePayments, bankTransactions, stockMovements }
}

// ============================================================================
// PHASE 6: CREATE PRODUCTION LOGS
// ============================================================================
async function createProductionLogs(
  ownerId: string,
  ownerName: string | null,
  products: Array<{ id: string; name: string; category: ProductCategory }>,
  inventoryItems: Array<{ id: string; name: string; unitCostGNF: number }>
) {
  console.log(`Phase 6: Creating daily production logs (Jan 1 - Feb 15, ${TOTAL_DAYS} days)...`)

  const productionLogs = []
  const productionItems = []
  const stockMovements = []

  // Get specific inventory item IDs
  const flourItem = inventoryItems.find(i => i.name === 'Wheat Flour')
  const butterItem = inventoryItems.find(i => i.name === 'Butter')
  const yeastItem = inventoryItems.find(i => i.name === 'Yeast')
  const eggsItem = inventoryItems.find(i => i.name === 'Eggs')
  const chocolateItem = inventoryItems.find(i => i.name === 'Chocolate')

  // Daily production template
  const dailyProductionTemplate = [
    { productName: 'Baguette', baseQty: 120, flourKg: 30, butterKg: 0, yeastKg: 1.2, eggsUnit: 0, chocolateKg: 0 },
    { productName: 'Croissant', baseQty: 60, flourKg: 6, butterKg: 3, yeastKg: 0.3, eggsUnit: 12, chocolateKg: 0 },
    { productName: 'Pain au Chocolat', baseQty: 40, flourKg: 4.8, butterKg: 2.4, yeastKg: 0.2, eggsUnit: 8, chocolateKg: 1.2 },
    { productName: 'Petit Pain', baseQty: 100, flourKg: 8, butterKg: 0, yeastKg: 0.5, eggsUnit: 0, chocolateKg: 0 },
    { productName: 'Brioche', baseQty: 25, flourKg: 3.75, butterKg: 2, yeastKg: 0.15, eggsUnit: 50, chocolateKg: 0 },
  ]

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const date = getDate(day)
    const dateKey = getDateKey(day)
    const dateLabel = getDateLabel(day)
    const dayOfWeek = date.getUTCDay()

    // Alternate production type based on day
    // Mon/Wed/Fri/Sun = Boulangerie, Tue/Thu/Sat = Patisserie
    const productionType = [0, 1, 3, 5].includes(dayOfWeek)
      ? ProductCategory.Boulangerie
      : ProductCategory.Patisserie

    const prodLogId = `prod-log-${dateKey}`

    // Calculate daily production with variation
    const ingredientDetails = dailyProductionTemplate.map((p) => {
      const qty = randomInt(Math.floor(p.baseQty * 0.8), Math.floor(p.baseQty * 1.2))
      const ratio = qty / p.baseQty
      return {
        product: p.productName,
        quantity: qty,
        flour: p.flourKg * ratio,
        butter: p.butterKg * ratio,
        yeast: p.yeastKg * ratio,
        eggs: Math.round(p.eggsUnit * ratio),
        chocolate: p.chocolateKg * ratio,
      }
    })

    const totalFlour = ingredientDetails.reduce((sum, d) => sum + d.flour, 0)
    const totalButter = ingredientDetails.reduce((sum, d) => sum + d.butter, 0)
    const totalYeast = ingredientDetails.reduce((sum, d) => sum + d.yeast, 0)
    const totalEggs = ingredientDetails.reduce((sum, d) => sum + d.eggs, 0)
    const totalChocolate = ingredientDetails.reduce((sum, d) => sum + d.chocolate, 0)
    const totalQuantity = ingredientDetails.reduce((sum, d) => sum + d.quantity, 0)

    // Calculate estimated cost
    const estimatedCost = Math.round(
      totalFlour * (flourItem?.unitCostGNF || 8000) +
      totalButter * (butterItem?.unitCostGNF || 35000) +
      totalYeast * (yeastItem?.unitCostGNF || 25000) +
      totalEggs * (eggsItem?.unitCostGNF || 1500) +
      totalChocolate * (chocolateItem?.unitCostGNF || 45000)
    )

    // Create production log
    const prodLog = await prisma.productionLog.create({
      data: {
        id: prodLogId,
        restaurantId: RESTAURANT_ID,
        date: date,
        productionType: productionType,
        productName: 'Daily Production',
        productNameFr: 'Production Quotidienne',
        quantity: totalQuantity,
        ingredients: ['Wheat Flour', 'Butter', 'Yeast', 'Eggs', 'Chocolate'],
        ingredientDetails: [
          { itemId: flourItem?.id, itemName: 'Wheat Flour', quantity: totalFlour, unit: 'kg', unitCostGNF: flourItem?.unitCostGNF },
          { itemId: butterItem?.id, itemName: 'Butter', quantity: totalButter, unit: 'kg', unitCostGNF: butterItem?.unitCostGNF },
          { itemId: yeastItem?.id, itemName: 'Yeast', quantity: totalYeast, unit: 'kg', unitCostGNF: yeastItem?.unitCostGNF },
          { itemId: eggsItem?.id, itemName: 'Eggs', quantity: totalEggs, unit: 'unit', unitCostGNF: eggsItem?.unitCostGNF },
          { itemId: chocolateItem?.id, itemName: 'Chocolate', quantity: totalChocolate, unit: 'kg', unitCostGNF: chocolateItem?.unitCostGNF },
        ].filter(i => i.itemId),
        estimatedCostGNF: estimatedCost,
        preparationStatus: ProductionStatus.Complete,
        status: SubmissionStatus.Approved,
        stockDeducted: true,
        stockDeductedAt: date,
        createdBy: ownerId,
        createdByName: ownerName,
      }
    })
    productionLogs.push(prodLog)

    // Create production items (link to products)
    for (const prodData of ingredientDetails) {
      const product = products.find(p => p.name === prodData.product)
      if (product) {
        const prodItem = await prisma.productionItem.create({
          data: {
            id: `prod-item-${dateKey}-${prodData.product.toLowerCase().replace(/\s+/g, '-')}`,
            productionLogId: prodLogId,
            productId: product.id,
            quantity: prodData.quantity,
          }
        })
        productionItems.push(prodItem)
      }
    }

    // Create stock movements (usage)
    const movements = [
      { item: flourItem, qty: -totalFlour },
      { item: butterItem, qty: -totalButter },
      { item: yeastItem, qty: -totalYeast },
      { item: eggsItem, qty: -totalEggs },
      { item: chocolateItem, qty: -totalChocolate },
    ]

    for (const mov of movements) {
      if (mov.item && mov.qty !== 0) {
        const stockMov = await prisma.stockMovement.create({
          data: {
            id: `mov-usage-${dateKey}-${mov.item.name.toLowerCase().replace(/\s+/g, '-')}`,
            restaurantId: RESTAURANT_ID,
            itemId: mov.item.id,
            type: 'Usage',
            quantity: mov.qty,
            unitCost: mov.item.unitCostGNF,
            reason: `Production: ${dateLabel}`,
            productionLogId: prodLogId,
            createdBy: ownerId,
            createdByName: ownerName,
            createdAt: date,
          }
        })
        stockMovements.push(stockMov)
      }
    }

    if (day % 7 === 0) {
      console.log(`  Week ${day / 7}: Created ${day} production logs`)
    }
  }

  console.log(`  Created ${productionLogs.length} production logs, ${productionItems.length} production items, ${stockMovements.length} stock movements`)
  return { productionLogs, productionItems, stockMovements }
}

// ============================================================================
// PHASE 7: CREATE DEBTS (Weekly)
// ============================================================================
async function createDebts(
  ownerId: string,
  ownerName: string | null,
  customers: Array<{ id: string; name: string }>
) {
  console.log('Phase 7: Creating weekly debts (6 total)...')

  const debts = []
  const debtPayments = []
  const bankTransactions = []

  // Create debts weekly: Jan 5, 12, 19, 26, Feb 2 (day 33), Feb 9 (day 40)
  const debtData = [
    { day: 5, customerIndex: 0, principal: 300000, paid: 0, status: DebtStatus.Outstanding, desc: 'Weekly bread order' },
    { day: 12, customerIndex: 2, principal: 500000, paid: 200000, status: DebtStatus.PartiallyPaid, desc: 'Hotel catering order' },
    { day: 19, customerIndex: 3, principal: 400000, paid: 400000, status: DebtStatus.FullyPaid, desc: 'Restaurant supply' },
    { day: 26, customerIndex: 4, principal: 200000, paid: 0, status: DebtStatus.Outstanding, desc: 'Wholesale order' },
    { day: 33, customerIndex: 1, principal: 350000, paid: 350000, status: DebtStatus.FullyPaid, desc: 'February catering order' },
    { day: 40, customerIndex: 3, principal: 450000, paid: 150000, status: DebtStatus.PartiallyPaid, desc: 'February supply order' },
  ]

  for (const d of debtData) {
    const date = getDate(d.day)
    const dateKey = getDateKey(d.day)
    const customer = customers[d.customerIndex]
    const debtId = `debt-dev-${dateKey}`

    // Due date is 14 days after creation
    const dueDate = new Date(date)
    dueDate.setDate(dueDate.getDate() + 14)

    const debt = await prisma.debt.create({
      data: {
        id: debtId,
        restaurantId: RESTAURANT_ID,
        customerId: customer.id,
        principalAmount: d.principal,
        paidAmount: d.paid,
        remainingAmount: d.principal - d.paid,
        status: d.status,
        dueDate: dueDate,
        description: d.desc,
        createdBy: ownerId,
        createdByName: ownerName,
      }
    })
    debts.push(debt)
    console.log(`  Created debt: ${customer.name} - ${d.principal.toLocaleString()} GNF (${d.status})`)

    // Create payment if paid > 0
    if (d.paid > 0) {
      const paymentDate = new Date(date)
      paymentDate.setDate(paymentDate.getDate() + 7) // Payment 7 days after debt

      const paymentId = `debt-pay-${dateKey}`
      const bankTxId = `bank-debt-${dateKey}`
      const paymentMethod = d.status === DebtStatus.FullyPaid ? 'Cash' : 'Orange Money'

      const debtPayment = await prisma.debtPayment.create({
        data: {
          id: paymentId,
          restaurantId: RESTAURANT_ID,
          debtId: debtId,
          customerId: customer.id,
          amount: d.paid,
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
          receiptNumber: `REC-DEBT-${dateKey}`,
          notes: d.status === DebtStatus.FullyPaid ? 'Full payment received' : 'Partial payment',
          receivedBy: ownerId,
          receivedByName: ownerName,
        }
      })
      debtPayments.push(debtPayment)

      // Bank transaction for debt collection
      const bankTx = await prisma.bankTransaction.create({
        data: {
          id: bankTxId,
          restaurantId: RESTAURANT_ID,
          date: paymentDate,
          amount: d.paid,
          type: BankTransactionType.Deposit,
          method: paymentMethod === 'Cash' ? BankPaymentMethod.Cash : BankPaymentMethod.OrangeMoney,
          reason: TransactionReason.DebtCollection,
          debtPaymentId: paymentId,
          description: `Debt collection: ${d.desc}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: paymentDate,
          bankRef: `DEB-${dateKey}`,
          createdBy: ownerId,
          createdByName: ownerName,
        }
      })
      bankTransactions.push(bankTx)
    }
  }

  console.log(`  Created ${debts.length} debts, ${debtPayments.length} payments, ${bankTransactions.length} bank transactions`)
  return { debts, debtPayments, bankTransactions }
}

// ============================================================================
// PHASE 8: CREATE CAPITAL MOVEMENTS
// ============================================================================
async function createCapitalMovements(ownerId: string, ownerName: string | null) {
  console.log('Phase 8: Creating capital movements...')

  const bankTransactions = []

  // Initial capital injection (Jan 1)
  const capitalTx = await prisma.bankTransaction.create({
    data: {
      id: 'bank-capital-injection',
      restaurantId: RESTAURANT_ID,
      date: getDate(1),
      amount: 10000000, // 10M GNF
      type: BankTransactionType.Deposit,
      method: BankPaymentMethod.Cash,
      reason: TransactionReason.CapitalInjection,
      description: 'Owner capital injection - January startup',
      status: BankTransactionStatus.Confirmed,
      confirmedAt: getDate(1),
      bankRef: 'CAP-001',
      createdBy: ownerId,
      createdByName: ownerName,
    }
  })
  bankTransactions.push(capitalTx)
  console.log('  Created capital injection: 10,000,000 GNF')

  // Owner withdrawal (mid-month)
  const withdrawalTx = await prisma.bankTransaction.create({
    data: {
      id: 'bank-owner-withdrawal',
      restaurantId: RESTAURANT_ID,
      date: getDate(15),
      amount: 5000000, // 5M GNF
      type: BankTransactionType.Withdrawal,
      method: BankPaymentMethod.Cash,
      reason: TransactionReason.OwnerWithdrawal,
      description: 'Owner withdrawal - Mid-month',
      status: BankTransactionStatus.Confirmed,
      confirmedAt: getDate(15),
      bankRef: 'OWN-001',
      createdBy: ownerId,
      createdByName: ownerName,
    }
  })
  bankTransactions.push(withdrawalTx)
  console.log('  Created owner withdrawal: 5,000,000 GNF')

  return bankTransactions
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function main() {
  console.log('='.repeat(60))
  console.log('Bakery Hub - Development Database Seeding')
  console.log('='.repeat(60))
  console.log(`Target: ${RESTAURANT_ID}`)
  console.log(`Date Range: Jan 1 - Feb 15, 2026 (${TOTAL_DAYS} days)`)
  console.log('='.repeat(60))
  console.log('')

  try {
    // Phase 1: Clear existing data
    await clearBusinessData()
    console.log('')

    // Phase 2: Fetch or create references
    const { restaurant, ownerUser, products, inventoryItems, categories } = await fetchOrCreateReferences()
    console.log('')

    // Phase 3: Create customers
    const customers = await createCustomers()
    console.log('')

    // Phase 4: Create daily sales
    const salesResult = await createDailySales(ownerUser.id, ownerUser.name, products)
    console.log('')

    // Phase 5: Create expenses
    const expensesResult = await createExpenses(ownerUser.id, ownerUser.name, categories, inventoryItems)
    console.log('')

    // Phase 6: Create production logs
    const productionResult = await createProductionLogs(ownerUser.id, ownerUser.name, products, inventoryItems)
    console.log('')

    // Phase 7: Create debts
    const debtsResult = await createDebts(ownerUser.id, ownerUser.name, customers)
    console.log('')

    // Phase 8: Create capital movements
    const capitalTxs = await createCapitalMovements(ownerUser.id, ownerUser.name)
    console.log('')

    // Summary
    console.log('='.repeat(60))
    console.log('SEEDING COMPLETED SUCCESSFULLY')
    console.log('='.repeat(60))
    console.log('')
    console.log('Data Summary:')
    console.log(`  Restaurant: ${restaurant.name}`)
    console.log(`  Customers: ${customers.length}`)
    console.log(`  Sales: ${salesResult.sales.length}`)
    console.log(`  Sale Items: ${salesResult.saleItems.length}`)
    console.log(`  Expenses: ${expensesResult.expenses.length}`)
    console.log(`  Expense Payments: ${expensesResult.expensePayments.length}`)
    console.log(`  Production Logs: ${productionResult.productionLogs.length}`)
    console.log(`  Production Items: ${productionResult.productionItems.length}`)
    console.log(`  Debts: ${debtsResult.debts.length}`)
    console.log(`  Debt Payments: ${debtsResult.debtPayments.length}`)

    const totalBankTx =
      salesResult.bankTransactions.length +
      expensesResult.bankTransactions.length +
      debtsResult.bankTransactions.length +
      capitalTxs.length
    console.log(`  Bank Transactions: ${totalBankTx}`)

    const totalStockMov =
      expensesResult.stockMovements.length +
      productionResult.stockMovements.length
    console.log(`  Stock Movements: ${totalStockMov}`)
    console.log('')
    console.log('Next Steps:')
    console.log('  1. Start dev server: npm run dev')
    console.log('  2. Check Sales page: /finances/sales')
    console.log('  3. Check Expenses page: /finances/expenses')
    console.log('  4. Check Bank page: /finances/bank')
    console.log('  5. Check Production page: /baking/production')
    console.log('  6. Check Debts page: /finances/debts')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
