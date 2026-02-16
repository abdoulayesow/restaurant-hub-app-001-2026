import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_1WiBuoTD5YRJ@ep-odd-smoke-abj5exe3-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
})

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('DETAILED PRODUCTION DATABASE ANALYSIS')
  console.log('='.repeat(70))

  // ============================================================================
  // RESTAURANTS
  // ============================================================================
  console.log('\n📍 RESTAURANTS')
  console.log('-'.repeat(50))
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      name: true,
      location: true,
      currency: true,
      initialCashBalance: true,
      initialOrangeBalance: true,
      initialCardBalance: true,
      restaurantType: true,
      isActive: true,
      createdAt: true
    }
  })

  for (const r of restaurants) {
    console.log(`\n  [${r.name}]`)
    console.log(`    ID: ${r.id}`)
    console.log(`    Location: ${r.location || 'N/A'}`)
    console.log(`    Type: ${r.restaurantType}`)
    console.log(`    Currency: ${r.currency}`)
    console.log(`    Initial Cash Balance: ${r.initialCashBalance?.toLocaleString() || 0} GNF`)
    console.log(`    Initial Orange Balance: ${r.initialOrangeBalance?.toLocaleString() || 0} GNF`)
    console.log(`    Initial Card Balance: ${r.initialCardBalance?.toLocaleString() || 0} GNF`)
    console.log(`    Active: ${r.isActive ? 'Yes' : 'No'}`)
    console.log(`    Created: ${r.createdAt.toISOString().split('T')[0]}`)
  }

  // ============================================================================
  // USERS
  // ============================================================================
  console.log('\n\n👤 USERS')
  console.log('-'.repeat(50))
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })

  for (const u of users) {
    console.log(`\n  [${u.name || u.email}]`)
    console.log(`    ID: ${u.id}`)
    console.log(`    Email: ${u.email}`)
    console.log(`    Role: ${u.role}`)
    console.log(`    Created: ${u.createdAt.toISOString().split('T')[0]}`)
  }

  // ============================================================================
  // USER-RESTAURANT ASSIGNMENTS
  // ============================================================================
  console.log('\n\n🔗 USER-RESTAURANT ASSIGNMENTS')
  console.log('-'.repeat(50))
  const userRests = await prisma.userRestaurant.findMany({
    include: {
      user: { select: { name: true, email: true } },
      restaurant: { select: { name: true } }
    }
  })

  for (const ur of userRests) {
    console.log(`  ${ur.user.name || ur.user.email} → ${ur.restaurant.name}`)
  }

  // ============================================================================
  // INVENTORY ITEMS BY RESTAURANT
  // ============================================================================
  console.log('\n\n📦 INVENTORY ITEMS BY RESTAURANT')
  console.log('-'.repeat(50))
  const items = await prisma.inventoryItem.findMany({
    include: { restaurant: { select: { name: true } } },
    orderBy: [{ restaurantId: 'asc' }, { category: 'asc' }, { name: 'asc' }]
  })

  // Group by restaurant
  const byRestaurant = new Map<string, typeof items>()
  for (const item of items) {
    const key = item.restaurant.name
    if (!byRestaurant.has(key)) byRestaurant.set(key, [])
    byRestaurant.get(key)!.push(item)
  }

  for (const [restName, restItems] of byRestaurant) {
    console.log(`\n  [${restName}] - ${restItems.length} items total`)

    // Group by category
    const byCategory = new Map<string, typeof restItems>()
    for (const item of restItems) {
      if (!byCategory.has(item.category)) byCategory.set(item.category, [])
      byCategory.get(item.category)!.push(item)
    }

    for (const [category, catItems] of byCategory) {
      console.log(`\n    ${category}: ${catItems.length} items`)
      for (const item of catItems) {
        const stockStatus = item.currentStock <= 0 ? '⚠️ ' : item.currentStock < item.minStock ? '🔶 ' : '✅ '
        console.log(`      ${stockStatus}${item.name}: ${item.currentStock} ${item.unit} (min: ${item.minStock}, cost: ${item.unitCostGNF?.toLocaleString() || 0} GNF)`)
      }
    }
  }

  // ============================================================================
  // SUPPLIERS
  // ============================================================================
  console.log('\n\n🚚 SUPPLIERS')
  console.log('-'.repeat(50))
  const suppliers = await prisma.supplier.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      paymentTerms: true,
      isActive: true
    }
  })

  if (suppliers.length === 0) {
    console.log('  No suppliers found')
  } else {
    for (const s of suppliers) {
      console.log(`\n  [${s.name}]`)
      console.log(`    Phone: ${s.phone || 'N/A'}`)
      console.log(`    Email: ${s.email || 'N/A'}`)
      console.log(`    Address: ${s.address || 'N/A'}`)
      console.log(`    Payment Terms: ${s.paymentTerms || 'N/A'}`)
      console.log(`    Active: ${s.isActive ? 'Yes' : 'No'}`)
    }
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================
  console.log('\n\n🥐 PRODUCTS')
  console.log('-'.repeat(50))
  const products = await prisma.product.findMany({
    include: { restaurant: { select: { name: true } } },
    orderBy: [{ restaurantId: 'asc' }, { category: 'asc' }, { name: 'asc' }]
  })

  if (products.length === 0) {
    console.log('  No products found')
  } else {
    for (const p of products) {
      console.log(`  ${p.name} (${p.category}) - ${p.restaurant.name} - ${p.priceGNF?.toLocaleString() || 0} GNF`)
    }
  }

  // ============================================================================
  // TRANSACTIONAL DATA SUMMARY
  // ============================================================================
  console.log('\n\n📊 TRANSACTIONAL DATA SUMMARY')
  console.log('-'.repeat(50))

  const counts = await Promise.all([
    prisma.sale.count(),
    prisma.saleItem.count(),
    prisma.expense.count(),
    prisma.expensePayment.count(),
    prisma.productionLog.count(),
    prisma.productionItem.count(),
    prisma.stockMovement.count(),
    prisma.debt.count(),
    prisma.debtPayment.count(),
    prisma.bankTransaction.count(),
    prisma.customer.count(),
    prisma.dailySummary.count()
  ])

  const labels = [
    'Sales', 'Sale Items', 'Expenses', 'Expense Payments',
    'Production Logs', 'Production Items', 'Stock Movements',
    'Debts', 'Debt Payments', 'Bank Transactions', 'Customers', 'Daily Summaries'
  ]

  labels.forEach((label, i) => {
    const count = counts[i]
    const status = count === 0 ? '✅' : '📝'
    console.log(`  ${status} ${label}: ${count}`)
  })

  // ============================================================================
  // DATA QUALITY CHECKS
  // ============================================================================
  console.log('\n\n🔍 DATA QUALITY CHECKS')
  console.log('-'.repeat(50))

  // Check for inventory items with negative stock
  const negativeStock = await prisma.inventoryItem.count({
    where: { currentStock: { lt: 0 } }
  })
  console.log(`  Items with negative stock: ${negativeStock} ${negativeStock > 0 ? '⚠️' : '✅'}`)

  // Check for items below minimum stock
  const belowMin = await prisma.inventoryItem.count({
    where: {
      currentStock: { lt: prisma.inventoryItem.fields.minStock }
    }
  })
  const belowMinItems = await prisma.inventoryItem.findMany({
    where: {
      AND: [
        { currentStock: { gt: 0 } },
        { minStock: { gt: 0 } }
      ]
    },
    select: { name: true, currentStock: true, minStock: true }
  })
  const actualBelowMin = belowMinItems.filter(i => i.currentStock < i.minStock)
  console.log(`  Items below minimum stock: ${actualBelowMin.length} ${actualBelowMin.length > 0 ? '🔶' : '✅'}`)

  // Check user-restaurant mapping integrity
  const allUserRests = await prisma.userRestaurant.findMany({
    include: {
      user: { select: { id: true } },
      restaurant: { select: { id: true } }
    }
  })
  const orphanedCount = allUserRests.filter(ur => !ur.user || !ur.restaurant).length
  console.log(`  Orphaned user-restaurant mappings: ${orphanedCount} ${orphanedCount > 0 ? '⚠️' : '✅'}`)

  console.log('\n' + '='.repeat(70))
  console.log('END OF ANALYSIS')
  console.log('='.repeat(70) + '\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
