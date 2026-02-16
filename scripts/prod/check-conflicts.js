const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('🔍 Checking production data for potential conflicts...\n')

  // Check total sales
  const totalSales = await prisma.sale.count()
  console.log(`📊 Total Sales: ${totalSales}`)

  // Check approved sales
  const approvedSales = await prisma.sale.count({
    where: { status: 'Approved' }
  })
  console.log(`✅ Approved Sales: ${approvedSales}`)

  // Check existing BankTransactions
  const totalTransactions = await prisma.bankTransaction.count()
  console.log(`💰 Total BankTransactions: ${totalTransactions}`)

  // Check BankTransactions linked to sales
  const salesTransactions = await prisma.bankTransaction.count({
    where: {
      saleId: { not: null }
    }
  })
  console.log(`🔗 BankTransactions linked to sales: ${salesTransactions}`)

  // Check for potential duplicates (same saleId + method)
  const allSaleTransactions = await prisma.bankTransaction.findMany({
    where: { saleId: { not: null } },
    select: { saleId: true, method: true }
  })

  const duplicateMap = new Map()
  allSaleTransactions.forEach(txn => {
    const key = `${txn.saleId}-${txn.method}`
    duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1)
  })

  const duplicates = Array.from(duplicateMap.entries()).filter(([_, count]) => count > 1)

  if (duplicates.length > 0) {
    console.log('\n⚠️  WARNING: Found duplicate saleId + method combinations:')
    duplicates.forEach(([key, count]) => {
      console.log(`   ${key}: ${count} duplicates`)
    })
  } else {
    console.log('\n✅ No duplicate saleId + method combinations found')
  }

  // Check approved sales without Orange/Card transactions
  const approvedWithOrange = await prisma.sale.count({
    where: {
      status: 'Approved',
      orangeMoneyGNF: { gt: 0 }
    }
  })

  const approvedWithCard = await prisma.sale.count({
    where: {
      status: 'Approved',
      cardGNF: { gt: 0 }
    }
  })

  const orangeTransactions = await prisma.bankTransaction.count({
    where: {
      method: 'OrangeMoney',
      saleId: { not: null }
    }
  })

  const cardTransactions = await prisma.bankTransaction.count({
    where: {
      method: 'Card',
      saleId: { not: null }
    }
  })

  console.log('\n📈 Sales vs Transactions Analysis:')
  console.log(`   Approved sales with Orange Money: ${approvedWithOrange}`)
  console.log(`   Existing Orange Money transactions: ${orangeTransactions}`)
  console.log(`   Missing Orange Money transactions: ${approvedWithOrange - orangeTransactions}`)

  console.log(`\n   Approved sales with Card: ${approvedWithCard}`)
  console.log(`   Existing Card transactions: ${cardTransactions}`)
  console.log(`   Missing Card transactions: ${approvedWithCard - cardTransactions}`)

  // Sample recent approved sales
  const recentApproved = await prisma.sale.findMany({
    where: { status: 'Approved' },
    include: {
      bankTransactions: {
        select: {
          method: true,
          status: true,
          amount: true
        }
      }
    },
    orderBy: { date: 'desc' },
    take: 3
  })

  console.log('\n📋 Sample Recent Approved Sales:')
  recentApproved.forEach((sale, i) => {
    console.log(`\nSale ${i + 1} (${sale.date.toISOString().split('T')[0]}):`)
    console.log(`   Cash: ${sale.cashGNF} | Orange: ${sale.orangeMoneyGNF} | Card: ${sale.cardGNF}`)
    console.log(`   BankTransactions: ${sale.bankTransactions.length}`)
    sale.bankTransactions.forEach(txn => {
      console.log(`   - ${txn.method}: ${txn.amount} (${txn.status})`)
    })
  })

  console.log('\n✅ Data check complete!')
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
