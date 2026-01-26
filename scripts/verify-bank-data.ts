/**
 * Verification Script: Bank Transaction System
 *
 * Quick verification of the bank transaction and expense payment system
 * Run with: npx tsx scripts/verify-bank-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying Bank Transaction System\n')

  // Check BankTransaction table
  const transactions = await prisma.bankTransaction.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: {
      restaurant: { select: { name: true } }
    }
  })

  console.log('📊 BankTransaction Status:')
  console.log(`   Total transactions: ${await prisma.bankTransaction.count()}`)
  if (transactions.length > 0) {
    console.log(`   Recent transactions:`)
    transactions.forEach(tx => {
      console.log(`   - ${tx.date.toISOString().split('T')[0]} | ${tx.type} | ${tx.amount} GNF | ${tx.method} | ${tx.status}`)
    })
  } else {
    console.log('   No transactions found (this is normal if starting fresh)')
  }

  // Check ExpensePayment table
  const payments = await prisma.expensePayment.findMany({
    take: 5,
    orderBy: { paidAt: 'desc' }
  })

  console.log('\n💰 ExpensePayment Status:')
  console.log(`   Total payments: ${await prisma.expensePayment.count()}`)
  if (payments.length > 0) {
    console.log(`   Recent payments:`)
    payments.forEach(p => {
      console.log(`   - ${p.paidAt.toISOString().split('T')[0]} | ${p.amount} GNF | ${p.paymentMethod}`)
    })
  } else {
    console.log('   No payments recorded yet')
  }

  // Check Expense payment status distribution
  const expenseStats = await prisma.expense.groupBy({
    by: ['paymentStatus'],
    _count: true,
    _sum: { totalPaidAmount: true, amountGNF: true }
  })

  console.log('\n📋 Expense Payment Status Distribution:')
  if (expenseStats.length > 0) {
    expenseStats.forEach(stat => {
      console.log(`   ${stat.paymentStatus}: ${stat._count} expenses`)
      if (stat._sum.amountGNF) {
        console.log(`      Total: ${stat._sum.amountGNF} GNF, Paid: ${stat._sum.totalPaidAmount || 0} GNF`)
      }
    })
  } else {
    console.log('   No expenses found')
  }

  // Check for unpaid approved expenses
  const unpaidExpenses = await prisma.expense.findMany({
    where: {
      status: 'Approved',
      paymentStatus: { in: ['Unpaid', 'PartiallyPaid'] }
    },
    select: {
      id: true,
      description: true,
      amountGNF: true,
      paymentStatus: true,
      totalPaidAmount: true
    },
    take: 5
  })

  console.log('\n⚠️  Unpaid/Partially Paid Expenses:')
  if (unpaidExpenses.length > 0) {
    unpaidExpenses.forEach(e => {
      const remaining = e.amountGNF - e.totalPaidAmount
      console.log(`   - ${e.description}: ${remaining} GNF remaining (${e.paymentStatus})`)
    })
  } else {
    console.log('   All approved expenses are fully paid! 🎉')
  }

  console.log('\n✅ Verification complete!')
}

main()
  .catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
