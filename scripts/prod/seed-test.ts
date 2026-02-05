/**
 * Production Test Restaurant Seeding Script
 *
 * Creates a test restaurant "Bliss test" in PRODUCTION with realistic data
 * for visualization and testing purposes.
 *
 * Usage: npx ts-node scripts/seed-prod-test.ts
 *
 * NOTE: This script connects to PRODUCTION database!
 * To remove this data, run: npx ts-node scripts/cleanup-prod-test.ts
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

// PRODUCTION DATABASE CONNECTION
const PROD_DATABASE_URL = 'postgresql://neondb_owner:npg_1WiBuoTD5YRJ@ep-odd-smoke-abj5exe3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_DATABASE_URL }
  }
})

// Constants
const RESTAURANT_ID = 'bliss-test'
const RESTAURANT_NAME = 'Bliss test'
const START_DATE = new Date(Date.UTC(2026, 0, 1)) // Jan 1, 2026
const END_DATE = new Date(Date.UTC(2026, 1, 1)) // Feb 1, 2026

// Calculate number of days
const TOTAL_DAYS = Math.ceil((END_DATE.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24))

// Helper to round to 100,000 GNF
function roundTo100k(amount: number): number {
  return Math.round(amount / 100000) * 100000
}

// Helper to get date for a specific day (starting from Jan 1)
function getDate(dayNumber: number): Date {
  const date = new Date(START_DATE)
  date.setUTCDate(date.getUTCDate() + dayNumber - 1)
  date.setUTCHours(12, 0, 0, 0)
  return date
}

// Helper to check if a day is weekend (Saturday = 6, Sunday = 0)
function isWeekend(dayNumber: number): boolean {
  const date = getDate(dayNumber)
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

// Format date for display
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ============================================================================
// PHASE 1: CHECK IF TEST RESTAURANT EXISTS
// ============================================================================
async function checkExistingRestaurant(): Promise<boolean> {
  const existing = await prisma.restaurant.findUnique({
    where: { id: RESTAURANT_ID }
  })
  return !!existing
}

// ============================================================================
// PHASE 2: CREATE RESTAURANT AND REFERENCES
// ============================================================================
async function createRestaurantAndReferences() {
  console.log('Phase 2: Creating restaurant and references...')

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      id: RESTAURANT_ID,
      name: RESTAURANT_NAME,
      location: 'Conakry - Test Location',
      currency: 'GNF',
      restaurantType: 'Bakery',
      initialCapital: 50000000,
      initialCashBalance: 5000000,
      initialOrangeBalance: 2000000,
      initialCardBalance: 1000000,
      contactPhone: '+224 620 99 99 99',
      managerName: 'Test Manager',
      trackingStartDate: START_DATE,
      isActive: true,
    }
  })
  console.log(`  Created restaurant: ${restaurant.name}`)

  // Get or create owner user (use existing owner from production)
  let ownerUser = await prisma.user.findFirst({
    where: { role: 'Owner' }
  })

  if (!ownerUser) {
    console.log('  WARNING: No owner user found in production. Creating test owner...')
    ownerUser = await prisma.user.create({
      data: {
        email: 'test-owner@bakery-test.local',
        name: 'Test Owner',
        role: 'Owner',
        defaultRestaurantId: RESTAURANT_ID,
      }
    })
  }

  // Assign owner to test restaurant
  await prisma.userRestaurant.create({
    data: {
      userId: ownerUser.id,
      restaurantId: RESTAURANT_ID,
      role: 'Owner',
    }
  })
  console.log(`  Assigned owner: ${ownerUser.name || ownerUser.email}`)

  // Create products for test restaurant
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

  const products = []
  for (let i = 0; i < productsTemplate.length; i++) {
    const p = productsTemplate[i]
    const product = await prisma.product.create({
      data: {
        id: `prod-test-${String(i + 1).padStart(2, '0')}`,
        restaurantId: RESTAURANT_ID,
        name: p.name,
        nameFr: p.nameFr,
        category: p.category,
        unit: p.unit,
        sortOrder: p.sortOrder,
        isActive: true,
      }
    })
    products.push(product)
  }
  console.log(`  Created ${products.length} products`)

  // Create inventory items for test restaurant
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

  const inventoryItems = []
  for (let i = 0; i < inventoryTemplate.length; i++) {
    const item = inventoryTemplate[i]
    const invItem = await prisma.inventoryItem.create({
      data: {
        id: `inv-test-${String(i + 1).padStart(2, '0')}`,
        restaurantId: RESTAURANT_ID,
        ...item,
      }
    })
    inventoryItems.push(invItem)
  }
  console.log(`  Created ${inventoryItems.length} inventory items`)

  // Get existing categories (global)
  const categories = await prisma.category.findMany({
    where: { isActive: true }
  })
  console.log(`  Found ${categories.length} existing categories`)

  return { restaurant, ownerUser, products, inventoryItems, categories }
}

// ============================================================================
// PHASE 3: CREATE CUSTOMERS
// ============================================================================
async function createCustomers() {
  console.log('Phase 3: Creating 5 customers...')

  const customersData = [
    {
      id: `cust-test-${RESTAURANT_ID}-01`,
      name: 'Mamadou Diallo',
      phone: '+224 620 001 001',
      email: 'mamadou.diallo@email.gn',
      customerType: CustomerType.Individual,
      creditLimit: 500000,
      company: null,
    },
    {
      id: `cust-test-${RESTAURANT_ID}-02`,
      name: 'Fatou Camara',
      phone: '+224 620 001 002',
      email: 'fatou.camara@email.gn',
      customerType: CustomerType.Individual,
      creditLimit: 300000,
      company: null,
    },
    {
      id: `cust-test-${RESTAURANT_ID}-03`,
      name: 'Hotel Riviera',
      phone: '+224 620 001 003',
      email: 'commandes@hotelriviera.gn',
      customerType: CustomerType.Corporate,
      creditLimit: 2000000,
      company: 'Hotel Riviera Conakry',
    },
    {
      id: `cust-test-${RESTAURANT_ID}-04`,
      name: 'Restaurant Le Maquis',
      phone: '+224 620 001 004',
      email: 'chef@lemaquis.gn',
      customerType: CustomerType.Corporate,
      creditLimit: 1500000,
      company: 'Le Maquis SARL',
    },
    {
      id: `cust-test-${RESTAURANT_ID}-05`,
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
// PHASE 4: CREATE DAILY SALES (Jan 1 - Feb 1)
// ============================================================================
async function createDailySales(
  ownerId: string,
  ownerName: string | null,
  products: Array<{ id: string; name: string; category: ProductCategory }>
) {
  console.log(`Phase 4: Creating daily sales (${formatDate(START_DATE)} to ${formatDate(END_DATE)})...`)

  const sales = []
  const saleItems = []
  const bankTransactions = []

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const date = getDate(day)
    const isWknd = isWeekend(day)

    // Base sales: 2.5M weekday, 3.5M weekend
    const baseSales = isWknd ? 3500000 : 2500000
    const totalGNF = varyAmount(baseSales, 15)

    // Payment split: 60% cash, 25% mobile, 15% card
    const cashGNF = roundTo100k(totalGNF * 0.60)
    const orangeMoneyGNF = roundTo100k(totalGNF * 0.25)
    const cardGNF = totalGNF - cashGNF - orangeMoneyGNF

    const saleId = `sale-test-${RESTAURANT_ID}-day${String(day).padStart(2, '0')}`

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
    if (cashGNF > 0) {
      const bankTxCash = await prisma.bankTransaction.create({
        data: {
          id: `bank-test-sale-cash-day${String(day).padStart(2, '0')}`,
          restaurantId: RESTAURANT_ID,
          date: date,
          amount: cashGNF,
          type: BankTransactionType.Deposit,
          method: BankPaymentMethod.Cash,
          reason: TransactionReason.SalesDeposit,
          saleId: saleId,
          description: `Daily sales deposit (Cash) - ${formatDate(date)}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `DEP-TEST-CASH-${String(day).padStart(3, '0')}`,
          createdBy: ownerId,
          createdByName: ownerName,
        }
      })
      bankTransactions.push(bankTxCash)
    }

    if (orangeMoneyGNF > 0) {
      const bankTxOrange = await prisma.bankTransaction.create({
        data: {
          id: `bank-test-sale-orange-day${String(day).padStart(2, '0')}`,
          restaurantId: RESTAURANT_ID,
          date: date,
          amount: orangeMoneyGNF,
          type: BankTransactionType.Deposit,
          method: BankPaymentMethod.OrangeMoney,
          reason: TransactionReason.SalesDeposit,
          saleId: saleId,
          description: `Daily sales deposit (Orange Money) - ${formatDate(date)}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `DEP-TEST-OM-${String(day).padStart(3, '0')}`,
          createdBy: ownerId,
          createdByName: ownerName,
        }
      })
      bankTransactions.push(bankTxOrange)
    }

    if (cardGNF > 0) {
      const bankTxCard = await prisma.bankTransaction.create({
        data: {
          id: `bank-test-sale-card-day${String(day).padStart(2, '0')}`,
          restaurantId: RESTAURANT_ID,
          date: date,
          amount: cardGNF,
          type: BankTransactionType.Deposit,
          method: BankPaymentMethod.Card,
          reason: TransactionReason.SalesDeposit,
          saleId: saleId,
          description: `Daily sales deposit (Card) - ${formatDate(date)}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `DEP-TEST-CARD-${String(day).padStart(3, '0')}`,
          createdBy: ownerId,
          createdByName: ownerName,
        }
      })
      bankTransactions.push(bankTxCard)
    }

    if (day % 7 === 0) {
      console.log(`  Week ${Math.ceil(day / 7)}: Created ${day} sales`)
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

  // Inventory purchases every 2 days
  for (let day = 2; day <= TOTAL_DAYS; day += 2) {
    const date = getDate(day)
    const amount = varyAmount(2000000, 25)
    const expId = `exp-test-inv-day${String(day).padStart(2, '0')}`
    const bankTxId = `bank-test-exp-inv-day${String(day).padStart(2, '0')}`
    const expPayId = `exp-test-pay-inv-day${String(day).padStart(2, '0')}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: flourCat?.id,
        categoryName: 'Flour',
        amountGNF: amount,
        paymentMethod: 'Cash',
        description: `Inventory restock - ${formatDate(date)}`,
        isInventoryPurchase: true,
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
        description: `Inventory purchase - ${formatDate(date)}`,
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-TEST-INV-${String(day).padStart(3, '0')}`,
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

    if (flourItem) {
      const qty = Math.round(amount / flourItem.unitCostGNF)
      const stockMov = await prisma.stockMovement.create({
        data: {
          id: `mov-test-purchase-day${String(day).padStart(2, '0')}`,
          restaurantId: RESTAURANT_ID,
          itemId: flourItem.id,
          type: 'Purchase',
          quantity: qty,
          unitCost: flourItem.unitCostGNF,
          reason: `Inventory restock - ${formatDate(date)}`,
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

  // Weekly utilities (days 7, 14, 21, 28)
  const utilityDays = [7, 14, 21, 28].filter(d => d <= TOTAL_DAYS)
  for (const day of utilityDays) {
    const date = getDate(day)
    const amount = varyAmount(600000, 20)
    const expId = `exp-test-util-day${String(day).padStart(2, '0')}`
    const bankTxId = `bank-test-util-day${String(day).padStart(2, '0')}`
    const expPayId = `exp-test-pay-util-day${String(day).padStart(2, '0')}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: electricityCat?.id,
        categoryName: 'Electricity',
        amountGNF: amount,
        paymentMethod: 'Orange Money',
        description: `Weekly utilities - Week ${Math.ceil(day / 7)}`,
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
        description: `Utilities - Week ${Math.ceil(day / 7)}`,
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-TEST-UTL-${String(day).padStart(3, '0')}`,
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
  console.log(`  Created ${utilityDays.length} utility expenses`)

  // Bi-monthly salaries (days 15, 28+)
  const salaryDays = [15, 28].filter(d => d <= TOTAL_DAYS)
  for (const day of salaryDays) {
    const date = getDate(day)
    const amount = varyAmount(3500000, 10)
    const expId = `exp-test-sal-day${String(day).padStart(2, '0')}`
    const bankTxId = `bank-test-sal-day${String(day).padStart(2, '0')}`
    const expPayId = `exp-test-pay-sal-day${String(day).padStart(2, '0')}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: salariesCat?.id,
        categoryName: 'Staff Salaries',
        amountGNF: amount,
        paymentMethod: 'Cash',
        description: day === 15 ? 'Mid-month salaries' : 'End-of-month salaries',
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
        description: day === 15 ? 'Mid-month salaries' : 'End-of-month salaries',
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-TEST-SAL-${String(day).padStart(3, '0')}`,
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
  console.log(`  Created ${salaryDays.length} salary expenses`)

  // Weekly supplies (days 5, 12, 19, 26)
  const supplyDays = [5, 12, 19, 26].filter(d => d <= TOTAL_DAYS)
  for (const day of supplyDays) {
    const date = getDate(day)
    const amount = varyAmount(400000, 30)
    const expId = `exp-test-sup-day${String(day).padStart(2, '0')}`
    const bankTxId = `bank-test-sup-day${String(day).padStart(2, '0')}`
    const expPayId = `exp-test-pay-sup-day${String(day).padStart(2, '0')}`

    const expense = await prisma.expense.create({
      data: {
        id: expId,
        restaurantId: RESTAURANT_ID,
        date: date,
        categoryId: packagingCat?.id,
        categoryName: 'Packaging',
        amountGNF: amount,
        paymentMethod: 'Card',
        description: `Supplies purchase - Week ${Math.ceil(day / 7)}`,
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
        description: `Supplies - Week ${Math.ceil(day / 7)}`,
        status: BankTransactionStatus.Confirmed,
        confirmedAt: date,
        bankRef: `WTH-TEST-SUP-${String(day).padStart(3, '0')}`,
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
  console.log(`  Created ${supplyDays.length} supply expenses`)

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
  console.log(`Phase 6: Creating daily production logs (${TOTAL_DAYS} days)...`)

  const productionLogs = []
  const productionItems = []
  const stockMovements = []

  const flourItem = inventoryItems.find(i => i.name === 'Wheat Flour')
  const butterItem = inventoryItems.find(i => i.name === 'Butter')
  const yeastItem = inventoryItems.find(i => i.name === 'Yeast')
  const eggsItem = inventoryItems.find(i => i.name === 'Eggs')
  const chocolateItem = inventoryItems.find(i => i.name === 'Chocolate')

  const dailyProductionTemplate = [
    { productName: 'Baguette', baseQty: 120, flourKg: 30, butterKg: 0, yeastKg: 1.2, eggsUnit: 0, chocolateKg: 0 },
    { productName: 'Croissant', baseQty: 60, flourKg: 6, butterKg: 3, yeastKg: 0.3, eggsUnit: 12, chocolateKg: 0 },
    { productName: 'Pain au Chocolat', baseQty: 40, flourKg: 4.8, butterKg: 2.4, yeastKg: 0.2, eggsUnit: 8, chocolateKg: 1.2 },
    { productName: 'Petit Pain', baseQty: 100, flourKg: 8, butterKg: 0, yeastKg: 0.5, eggsUnit: 0, chocolateKg: 0 },
    { productName: 'Brioche', baseQty: 25, flourKg: 3.75, butterKg: 2, yeastKg: 0.15, eggsUnit: 50, chocolateKg: 0 },
  ]

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const date = getDate(day)
    const dayOfWeek = date.getUTCDay()

    const productionType = [0, 1, 3, 5].includes(dayOfWeek)
      ? ProductCategory.Boulangerie
      : ProductCategory.Patisserie

    const prodLogId = `prod-test-log-day${String(day).padStart(2, '0')}`

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

    const estimatedCost = Math.round(
      totalFlour * (flourItem?.unitCostGNF || 8000) +
      totalButter * (butterItem?.unitCostGNF || 35000) +
      totalYeast * (yeastItem?.unitCostGNF || 25000) +
      totalEggs * (eggsItem?.unitCostGNF || 1500) +
      totalChocolate * (chocolateItem?.unitCostGNF || 45000)
    )

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

    for (const prodData of ingredientDetails) {
      const product = products.find(p => p.name === prodData.product)
      if (product) {
        const prodItem = await prisma.productionItem.create({
          data: {
            id: `prod-test-item-day${String(day).padStart(2, '0')}-${prodData.product.toLowerCase().replace(/\s+/g, '-')}`,
            productionLogId: prodLogId,
            productId: product.id,
            quantity: prodData.quantity,
          }
        })
        productionItems.push(prodItem)
      }
    }

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
            id: `mov-test-usage-day${String(day).padStart(2, '0')}-${mov.item.name.toLowerCase().replace(/\s+/g, '-')}`,
            restaurantId: RESTAURANT_ID,
            itemId: mov.item.id,
            type: 'Usage',
            quantity: mov.qty,
            unitCost: mov.item.unitCostGNF,
            reason: `Production: ${formatDate(date)}`,
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
      console.log(`  Week ${Math.ceil(day / 7)}: Created ${day} production logs`)
    }
  }

  console.log(`  Created ${productionLogs.length} production logs, ${productionItems.length} production items, ${stockMovements.length} stock movements`)
  return { productionLogs, productionItems, stockMovements }
}

// ============================================================================
// PHASE 7: CREATE DEBTS
// ============================================================================
async function createDebts(
  ownerId: string,
  ownerName: string | null,
  customers: Array<{ id: string; name: string }>
) {
  console.log('Phase 7: Creating weekly debts...')

  const debts = []
  const debtPayments = []
  const bankTransactions = []

  const debtDays = [5, 12, 19, 26].filter(d => d <= TOTAL_DAYS)
  const debtData = [
    { day: 5, customerIndex: 0, principal: 300000, paid: 0, status: DebtStatus.Outstanding, desc: 'Weekly bread order' },
    { day: 12, customerIndex: 2, principal: 500000, paid: 200000, status: DebtStatus.PartiallyPaid, desc: 'Hotel catering order' },
    { day: 19, customerIndex: 3, principal: 400000, paid: 400000, status: DebtStatus.FullyPaid, desc: 'Restaurant supply' },
    { day: 26, customerIndex: 4, principal: 200000, paid: 0, status: DebtStatus.Outstanding, desc: 'Wholesale order' },
  ]

  for (const d of debtData) {
    if (d.day > TOTAL_DAYS) continue

    const date = getDate(d.day)
    const customer = customers[d.customerIndex]
    const debtId = `debt-test-day${String(d.day).padStart(2, '0')}`

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

    if (d.paid > 0) {
      const paymentDate = new Date(date)
      paymentDate.setDate(paymentDate.getDate() + 7)

      const paymentId = `debt-test-pay-day${String(d.day).padStart(2, '0')}`
      const bankTxId = `bank-test-debt-day${String(d.day).padStart(2, '0')}`
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
          receiptNumber: `REC-TEST-DEBT-${String(d.day).padStart(3, '0')}`,
          notes: d.status === DebtStatus.FullyPaid ? 'Full payment received' : 'Partial payment',
          receivedBy: ownerId,
          receivedByName: ownerName,
        }
      })
      debtPayments.push(debtPayment)

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
          bankRef: `DEB-TEST-${String(d.day).padStart(3, '0')}`,
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

  const capitalTx = await prisma.bankTransaction.create({
    data: {
      id: 'bank-test-capital-injection',
      restaurantId: RESTAURANT_ID,
      date: getDate(1),
      amount: 10000000,
      type: BankTransactionType.Deposit,
      method: BankPaymentMethod.Cash,
      reason: TransactionReason.CapitalInjection,
      description: 'Owner capital injection - January startup',
      status: BankTransactionStatus.Confirmed,
      confirmedAt: getDate(1),
      bankRef: 'CAP-TEST-001',
      createdBy: ownerId,
      createdByName: ownerName,
    }
  })
  bankTransactions.push(capitalTx)
  console.log('  Created capital injection: 10,000,000 GNF')

  if (TOTAL_DAYS >= 15) {
    const withdrawalTx = await prisma.bankTransaction.create({
      data: {
        id: 'bank-test-owner-withdrawal',
        restaurantId: RESTAURANT_ID,
        date: getDate(15),
        amount: 5000000,
        type: BankTransactionType.Withdrawal,
        method: BankPaymentMethod.Cash,
        reason: TransactionReason.OwnerWithdrawal,
        description: 'Owner withdrawal - Mid-month',
        status: BankTransactionStatus.Confirmed,
        confirmedAt: getDate(15),
        bankRef: 'OWN-TEST-001',
        createdBy: ownerId,
        createdByName: ownerName,
      }
    })
    bankTransactions.push(withdrawalTx)
    console.log('  Created owner withdrawal: 5,000,000 GNF')
  }

  return bankTransactions
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function main() {
  console.log('='.repeat(60))
  console.log('Bakery Hub - PRODUCTION Test Restaurant Seeding')
  console.log('='.repeat(60))
  console.log(`Target: ${RESTAURANT_NAME} (${RESTAURANT_ID})`)
  console.log(`Date Range: ${formatDate(START_DATE)} to ${formatDate(END_DATE)} (${TOTAL_DAYS} days)`)
  console.log(`Database: PRODUCTION (Neon)`)
  console.log('='.repeat(60))
  console.log('')

  // Safety check
  console.log('Phase 1: Checking if test restaurant already exists...')
  const exists = await checkExistingRestaurant()
  if (exists) {
    console.log(`  ERROR: Restaurant '${RESTAURANT_NAME}' already exists!`)
    console.log('  To recreate, first run: npx ts-node scripts/cleanup-prod-test.ts')
    process.exit(1)
  }
  console.log('  Restaurant does not exist. Proceeding with seeding...')
  console.log('')

  try {
    // Phase 2: Create restaurant and references
    const { restaurant, ownerUser, products, inventoryItems, categories } = await createRestaurantAndReferences()
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
    console.log('PRODUCTION SEEDING COMPLETED SUCCESSFULLY')
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
    console.log('To remove this test data, run:')
    console.log('  npx ts-node scripts/cleanup-prod-test.ts')
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
