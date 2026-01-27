/**
 * Data Migration Script: CashDeposit to BankTransaction
 *
 * This script migrates existing data to the new bank transaction system:
 * 1. Migrates CashDeposit records to BankTransaction
 * 2. Updates approved Expenses to paymentStatus = 'Unpaid'
 *
 * Run with: npx tsx scripts/migrate-bank-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting data migration...\n')

  // Step 1: Migrate CashDeposit to BankTransaction
  console.log('📦 Step 1: Migrating CashDeposit records to BankTransaction...')

  const cashDeposits = await prisma.cashDeposit.findMany({
    orderBy: { date: 'asc' }
  })

  console.log(`   Found ${cashDeposits.length} CashDeposit records to migrate`)

  let migratedCount = 0
  let skippedCount = 0

  for (const deposit of cashDeposits) {
    try {
      // Check if already migrated (by checking if saleId exists in BankTransaction)
      if (deposit.saleId) {
        const existing = await prisma.bankTransaction.findFirst({
          where: { saleId: deposit.saleId }
        })
        if (existing) {
          console.log(`   ⏭️  Skipping deposit ${deposit.id} (already migrated via saleId)`)
          skippedCount++
          continue
        }
      }

      // Map CashDepositStatus to BankTransactionStatus
      const status = deposit.status === 'Deposited' ? 'Confirmed' : 'Pending'
      const confirmedAt = deposit.status === 'Deposited' ? deposit.depositedAt : null

      // Determine reason
      const reason = deposit.saleId ? 'SalesDeposit' : 'Other'

      await prisma.bankTransaction.create({
        data: {
          id: deposit.id, // Keep same ID for reference
          restaurantId: deposit.restaurantId,
          date: deposit.date,
          amount: deposit.amount,
          type: 'Deposit',
          method: 'Cash',
          reason: reason,
          description: deposit.comments,
          status: status,
          confirmedAt: confirmedAt,
          bankRef: deposit.bankRef,
          receiptUrl: deposit.receiptUrl,
          saleId: deposit.saleId,
          createdBy: deposit.depositedBy,
          createdByName: deposit.depositedByName,
          comments: deposit.comments,
          createdAt: deposit.createdAt,
          updatedAt: deposit.updatedAt,
        }
      })

      migratedCount++
      console.log(`   ✅ Migrated deposit ${deposit.id} (${deposit.amount} GNF, ${deposit.status})`)
    } catch (error) {
      console.error(`   ❌ Failed to migrate deposit ${deposit.id}:`, error)
    }
  }

  console.log(`\n   Migration complete: ${migratedCount} migrated, ${skippedCount} skipped\n`)

  // Step 2: Update Expense payment statuses
  console.log('💰 Step 2: Updating Expense payment statuses...')

  const result = await prisma.expense.updateMany({
    where: {
      status: 'Approved',
      paymentStatus: 'Unpaid', // Only update if still Unpaid (default)
      totalPaidAmount: 0,
    },
    data: {
      paymentStatus: 'Unpaid', // Explicitly set to Unpaid (redundant but clear)
    }
  })

  console.log(`   ✅ Updated ${result.count} approved expenses to Unpaid status\n`)

  // Step 3: Summary
  console.log('📊 Migration Summary:')
  console.log(`   - CashDeposits migrated: ${migratedCount}`)
  console.log(`   - CashDeposits skipped: ${skippedCount}`)
  console.log(`   - Expenses updated: ${result.count}`)

  // Verify data
  console.log('\n🔍 Verification:')
  const totalTransactions = await prisma.bankTransaction.count()
  const totalPayments = await prisma.expensePayment.count()
  const unpaidExpenses = await prisma.expense.count({
    where: {
      status: 'Approved',
      paymentStatus: 'Unpaid'
    }
  })

  console.log(`   - Total BankTransactions: ${totalTransactions}`)
  console.log(`   - Total ExpensePayments: ${totalPayments}`)
  console.log(`   - Unpaid Expenses: ${unpaidExpenses}`)

  console.log('\n✨ Migration completed successfully!')
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
