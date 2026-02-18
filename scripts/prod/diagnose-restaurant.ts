/**
 * Production Database Diagnosis Script (Per-Restaurant)
 *
 * Read-only script that shows all transactional/financial data for a specific restaurant.
 * Useful for investigating unexpected data in production.
 *
 * Usage:
 *   npx tsx scripts/prod/diagnose-restaurant.ts                  # defaults to bliss-miniere
 *   npx tsx scripts/prod/diagnose-restaurant.ts bliss-tahouyah   # specific restaurant
 */

import { PrismaClient } from '@prisma/client'

const PROD_DATABASE_URL = 'postgresql://neondb_owner:npg_1WiBuoTD5YRJ@ep-odd-smoke-abj5exe3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
const DEFAULT_RESTAURANT_ID = 'bliss-miniere'

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_DATABASE_URL }
  }
})

const restaurantId = process.argv[2] || DEFAULT_RESTAURANT_ID

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatGNF(amount: number): string {
  return `${amount.toLocaleString()} GNF`
}

async function getTransactionCounts(restaurantId: string) {
  const [
    sales, saleItems, expenses, expensePayments, expenseItems,
    productionLogs, productionItems, stockMovements,
    debts, debtPayments, bankTransactions, customers,
    dailySummaries, stockReconciliations, reconciliationItems,
    inventoryTransfers, notificationLogs
  ] = await Promise.all([
    prisma.sale.count({ where: { restaurantId } }),
    prisma.saleItem.count({ where: { sale: { restaurantId } } }),
    prisma.expense.count({ where: { restaurantId } }),
    prisma.expensePayment.count({ where: { expense: { restaurantId } } }),
    prisma.expenseItem.count({ where: { expense: { restaurantId } } }),
    prisma.productionLog.count({ where: { restaurantId } }),
    prisma.productionItem.count({ where: { productionLog: { restaurantId } } }),
    prisma.stockMovement.count({ where: { restaurantId } }),
    prisma.debt.count({ where: { restaurantId } }),
    prisma.debtPayment.count({ where: { restaurantId } }),
    prisma.bankTransaction.count({ where: { restaurantId } }),
    prisma.customer.count({ where: { restaurantId } }),
    prisma.dailySummary.count({ where: { restaurantId } }),
    prisma.stockReconciliation.count({ where: { restaurantId } }),
    prisma.reconciliationItem.count({ where: { reconciliation: { restaurantId } } }),
    prisma.inventoryTransfer.count({ where: { OR: [{ sourceRestaurantId: restaurantId }, { targetRestaurantId: restaurantId }] } }),
    prisma.notificationLog.count({ where: { restaurantId } }),
  ])

  return {
    sales, saleItems, expenses, expensePayments, expenseItems,
    productionLogs, productionItems, stockMovements,
    debts, debtPayments, bankTransactions, customers,
    dailySummaries, stockReconciliations, reconciliationItems,
    inventoryTransfers, notificationLogs
  }
}

function printCounts(counts: Record<string, number>, label: string) {
  console.log(`\n${label}`)
  console.log('-'.repeat(50))

  const labels: Record<string, string> = {
    sales: 'Sales',
    saleItems: 'Sale Items',
    expenses: 'Expenses',
    expensePayments: 'Expense Payments',
    expenseItems: 'Expense Items',
    productionLogs: 'Production Logs',
    productionItems: 'Production Items',
    stockMovements: 'Stock Movements',
    debts: 'Debts',
    debtPayments: 'Debt Payments',
    bankTransactions: 'Bank Transactions',
    customers: 'Customers',
    dailySummaries: 'Daily Summaries',
    stockReconciliations: 'Stock Reconciliations',
    reconciliationItems: 'Reconciliation Items',
    inventoryTransfers: 'Inventory Transfers',
    notificationLogs: 'Notification Logs',
  }

  for (const [key, count] of Object.entries(counts)) {
    const marker = count > 0 ? '!!' : 'ok'
    console.log(`  [${marker}] ${labels[key] || key}: ${count}`)
  }
}

async function diagnoseRestaurant(restaurantId: string) {
  console.log('='.repeat(60))
  console.log('Production Restaurant Diagnosis')
  console.log('='.repeat(60))
  console.log(`Target: ${restaurantId}`)
  console.log('')

  // Phase 1: Verify restaurant exists
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true, name: true, location: true, currency: true,
      initialCapital: true, initialCashBalance: true,
      initialOrangeBalance: true, initialCardBalance: true,
      trackingStartDate: true, isActive: true
    }
  })

  if (!restaurant) {
    console.log(`Restaurant '${restaurantId}' not found.`)
    return
  }

  console.log(`Restaurant: ${restaurant.name}`)
  console.log(`  Location: ${restaurant.location || 'N/A'}`)
  console.log(`  Currency: ${restaurant.currency}`)
  console.log(`  Initial Capital: ${formatGNF(restaurant.initialCapital || 0)}`)
  console.log(`  Cash Balance: ${formatGNF(restaurant.initialCashBalance || 0)}`)
  console.log(`  Orange Balance: ${formatGNF(restaurant.initialOrangeBalance || 0)}`)
  console.log(`  Card Balance: ${formatGNF(restaurant.initialCardBalance || 0)}`)
  console.log(`  Tracking Start: ${restaurant.trackingStartDate ? formatDate(restaurant.trackingStartDate) : 'N/A'}`)
  console.log(`  Active: ${restaurant.isActive ? 'Yes' : 'No'}`)

  // Phase 2: Transaction counts
  const counts = await getTransactionCounts(restaurantId)
  printCounts(counts, 'Transaction Counts')

  const totalRecords = Object.values(counts).reduce((sum, c) => sum + c, 0)
  if (totalRecords === 0) {
    console.log('\nNo transactional data found. Restaurant is clean.')
    console.log('='.repeat(60))
    return
  }

  // Phase 3: Sales details
  if (counts.sales > 0) {
    console.log('\n\nSales Details')
    console.log('-'.repeat(50))

    const sales = await prisma.sale.findMany({
      where: { restaurantId },
      orderBy: { date: 'asc' },
      select: {
        date: true, totalGNF: true, cashGNF: true, orangeMoneyGNF: true,
        cardGNF: true, status: true, submittedByName: true, itemsCount: true,
        saleItems: { select: { productName: true, quantity: true, unitPrice: true } }
      }
    })

    for (const sale of sales) {
      console.log(`\n  ${formatDate(sale.date)} | ${formatGNF(sale.totalGNF)} | ${sale.status}`)
      console.log(`    Cash: ${formatGNF(sale.cashGNF)} | Orange: ${formatGNF(sale.orangeMoneyGNF)} | Card: ${formatGNF(sale.cardGNF)}`)
      console.log(`    Submitted by: ${sale.submittedByName || 'N/A'} | Items count: ${sale.itemsCount || 0}`)

      if (sale.saleItems.length > 0) {
        for (const item of sale.saleItems) {
          console.log(`      - ${item.productName}: ${item.quantity} x ${formatGNF(item.unitPrice)}`)
        }
      }
    }
  }

  // Phase 4: Bank transaction details
  if (counts.bankTransactions > 0) {
    console.log('\n\nBank Transaction Details')
    console.log('-'.repeat(50))

    const transactions = await prisma.bankTransaction.findMany({
      where: { restaurantId },
      orderBy: { date: 'asc' },
      select: {
        date: true, amount: true, type: true, method: true,
        reason: true, status: true, description: true,
        saleId: true, debtPaymentId: true, createdByName: true
      }
    })

    for (const tx of transactions) {
      const source = tx.saleId ? `Sale: ${tx.saleId.slice(0, 8)}...` :
                     tx.debtPaymentId ? `Debt: ${tx.debtPaymentId.slice(0, 8)}...` :
                     'Manual'
      console.log(`  ${formatDate(tx.date)} | ${tx.type} | ${formatGNF(tx.amount)} | ${tx.method} | ${tx.reason} | ${tx.status}`)
      console.log(`    Source: ${source} | By: ${tx.createdByName || 'N/A'} | ${tx.description || ''}`)
    }
  }

  // Phase 5: Expense details
  if (counts.expenses > 0) {
    console.log('\n\nExpense Details')
    console.log('-'.repeat(50))

    const expenses = await prisma.expense.findMany({
      where: { restaurantId },
      orderBy: { date: 'asc' },
      select: {
        date: true, categoryName: true, amountGNF: true,
        paymentStatus: true, paymentMethod: true, description: true,
        _count: { select: { expenseItems: true, expensePayments: true } }
      }
    })

    for (const exp of expenses) {
      console.log(`  ${formatDate(exp.date)} | ${exp.categoryName} | ${formatGNF(exp.amountGNF)} | ${exp.paymentStatus} | ${exp.paymentMethod || 'N/A'}`)
      console.log(`    ${exp.description || 'No description'} | Items: ${exp._count.expenseItems} | Payments: ${exp._count.expensePayments}`)
    }
  }

  // Phase 6: Debt details
  if (counts.debts > 0) {
    console.log('\n\nDebt Details')
    console.log('-'.repeat(50))

    const debts = await prisma.debt.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'asc' },
      include: {
        customer: { select: { name: true } },
        _count: { select: { payments: true } }
      }
    })

    for (const debt of debts) {
      console.log(`  ${debt.customer?.name || 'Unknown'} | ${formatGNF(debt.principalAmount)} | Paid: ${formatGNF(debt.paidAmount)} | Remaining: ${formatGNF(debt.remainingAmount)} | ${debt.status}`)
      console.log(`    Payments: ${debt._count.payments}`)
    }
  }

  // Phase 7: Production log details
  if (counts.productionLogs > 0) {
    console.log('\n\nProduction Log Details')
    console.log('-'.repeat(50))

    const logs = await prisma.productionLog.findMany({
      where: { restaurantId },
      orderBy: { date: 'asc' },
      select: {
        date: true, productName: true, quantity: true,
        status: true, createdByName: true,
        _count: { select: { productionItems: true } }
      }
    })

    for (const log of logs) {
      console.log(`  ${formatDate(log.date)} | ${log.productName} | Qty: ${log.quantity} | ${log.status} | Items: ${log._count.productionItems}`)
    }
  }

  // Phase 8: Other data summary
  if (counts.customers > 0) {
    console.log('\n\nCustomers')
    console.log('-'.repeat(50))
    const customers = await prisma.customer.findMany({
      where: { restaurantId },
      select: { name: true, type: true, phone: true }
    })
    for (const c of customers) {
      console.log(`  ${c.name} | ${c.type} | ${c.phone || 'No phone'}`)
    }
  }

  if (counts.stockMovements > 0) {
    console.log('\n\nStock Movements Summary')
    console.log('-'.repeat(50))
    const movements = await prisma.stockMovement.groupBy({
      by: ['type'],
      where: { restaurantId },
      _count: true,
      _sum: { quantity: true }
    })
    for (const m of movements) {
      console.log(`  ${m.type}: ${m._count} movements (total qty: ${m._sum.quantity})`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('END OF DIAGNOSIS')
  console.log('='.repeat(60))
}

diagnoseRestaurant(restaurantId)
  .catch((e) => {
    console.error('Diagnosis failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
