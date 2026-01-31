/**
 * Production Database Reset Script
 *
 * This script resets the production database for testing:
 * - Clears all transactions (sales, expenses, debts, production, bank transactions)
 * - Updates user roles to new RBAC system
 * - Resets capital to 1,000,000 GNF
 * - Resets inventory to minimal stock
 * - KEEPS existing users, restaurants, products, categories, etc.
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/prod/reset.ts
 *
 * Or with .env.prod:
 *   Copy .env.prod to .env temporarily, then run:
 *   npx tsx scripts/prod/reset.ts
 */

import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration
const CONFIG = {
  initialCapital: 1000000, // 1,000,000 GNF
  initialCashBalance: 500000,
  initialOrangeBalance: 300000,
  initialCardBalance: 200000,
  minimalStock: {
    // Reduce all inventory to these minimal levels
    default: 5,
    eggs: 20,
    boxes: 30,
  },
}

// User role mappings - existing users to new RBAC roles
const USER_ROLE_MAPPINGS: Record<string, { globalRole: UserRole; restaurantRole: UserRole }> = {
  'abdoulaye.sow.1989@gmail.com': {
    globalRole: UserRole.Owner,
    restaurantRole: UserRole.Owner,
  },
  'abdoulaye.sow.co@gmail.com': {
    globalRole: UserRole.RestaurantManager,
    restaurantRole: UserRole.RestaurantManager,
  },
}

async function main() {
  console.log('='.repeat(60))
  console.log('Production Database Reset')
  console.log('='.repeat(60))
  console.log('')
  console.log('This will:')
  console.log('  - Clear all transactions (sales, expenses, debts, etc.)')
  console.log('  - Update user roles to new RBAC system')
  console.log(`  - Reset capital to ${CONFIG.initialCapital.toLocaleString()} GNF`)
  console.log('  - Reset inventory to minimal stock')
  console.log('')

  // ============================================================================
  // PHASE 1: CLEAR TRANSACTIONS
  // ============================================================================
  console.log('Phase 1: Clearing transactions...')

  // Order matters due to foreign keys
  // First, clear dependent records
  const saleItemsDeleted = await prisma.saleItem.deleteMany({})
  console.log(`  Deleted ${saleItemsDeleted.count} sale items`)

  const productionItemsDeleted = await prisma.productionItem.deleteMany({})
  console.log(`  Deleted ${productionItemsDeleted.count} production items`)

  const debtPaymentsDeleted = await prisma.debtPayment.deleteMany({})
  console.log(`  Deleted ${debtPaymentsDeleted.count} debt payments`)

  const expensePaymentsDeleted = await prisma.expensePayment.deleteMany({})
  console.log(`  Deleted ${expensePaymentsDeleted.count} expense payments`)

  const stockMovementsDeleted = await prisma.stockMovement.deleteMany({})
  console.log(`  Deleted ${stockMovementsDeleted.count} stock movements`)

  // Now clear main transaction tables
  const bankTransactionsDeleted = await prisma.bankTransaction.deleteMany({})
  console.log(`  Deleted ${bankTransactionsDeleted.count} bank transactions`)

  const salesDeleted = await prisma.sale.deleteMany({})
  console.log(`  Deleted ${salesDeleted.count} sales`)

  const expensesDeleted = await prisma.expense.deleteMany({})
  console.log(`  Deleted ${expensesDeleted.count} expenses`)

  const productionLogsDeleted = await prisma.productionLog.deleteMany({})
  console.log(`  Deleted ${productionLogsDeleted.count} production logs`)

  const debtsDeleted = await prisma.debt.deleteMany({})
  console.log(`  Deleted ${debtsDeleted.count} debts`)

  console.log('')

  // ============================================================================
  // PHASE 2: UPDATE USER ROLES
  // ============================================================================
  console.log('Phase 2: Updating user roles to RBAC...')

  const users = await prisma.user.findMany({
    include: {
      restaurants: {
        include: { restaurant: true }
      }
    }
  })

  for (const user of users) {
    const mapping = USER_ROLE_MAPPINGS[user.email]

    if (mapping) {
      // Update global role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: mapping.globalRole }
      })
      console.log(`  ${user.email}: ${user.role} → ${mapping.globalRole}`)

      // Update restaurant-specific roles
      for (const ur of user.restaurants) {
        await prisma.userRestaurant.update({
          where: { id: ur.id },
          data: { role: mapping.restaurantRole }
        })
        console.log(`    └─ ${ur.restaurant.name}: ${mapping.restaurantRole}`)
      }
    } else {
      console.log(`  ${user.email}: No mapping defined, keeping ${user.role}`)
    }
  }

  // Ensure owner is assigned to all restaurants
  const ownerEmail = 'abdoulaye.sow.1989@gmail.com'
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } })
  const restaurants = await prisma.restaurant.findMany()

  if (owner) {
    for (const restaurant of restaurants) {
      await prisma.userRestaurant.upsert({
        where: {
          userId_restaurantId: {
            userId: owner.id,
            restaurantId: restaurant.id,
          },
        },
        update: { role: UserRole.Owner },
        create: {
          userId: owner.id,
          restaurantId: restaurant.id,
          role: UserRole.Owner,
        },
      })
    }
    console.log(`  Ensured ${ownerEmail} is Owner on all ${restaurants.length} restaurants`)
  }

  console.log('')

  // ============================================================================
  // PHASE 3: RESET CAPITAL
  // ============================================================================
  console.log('Phase 3: Resetting capital...')

  for (const restaurant of restaurants) {
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        initialCapital: CONFIG.initialCapital,
        initialCashBalance: CONFIG.initialCashBalance,
        initialOrangeBalance: CONFIG.initialOrangeBalance,
        initialCardBalance: CONFIG.initialCardBalance,
        trackingStartDate: new Date(), // Reset tracking start to today
      }
    })
    console.log(`  ${restaurant.name}: ${restaurant.initialCapital?.toLocaleString() || 0} → ${CONFIG.initialCapital.toLocaleString()} GNF`)
  }

  console.log('')

  // ============================================================================
  // PHASE 4: RESET INVENTORY TO MINIMAL STOCK
  // ============================================================================
  console.log('Phase 4: Resetting inventory to minimal stock...')

  const inventoryItems = await prisma.inventoryItem.findMany()
  let updatedCount = 0

  for (const item of inventoryItems) {
    let newStock = CONFIG.minimalStock.default

    // Special cases for certain items
    if (item.name.toLowerCase().includes('egg')) {
      newStock = CONFIG.minimalStock.eggs
    } else if (item.name.toLowerCase().includes('box')) {
      newStock = CONFIG.minimalStock.boxes
    }

    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: { currentStock: newStock }
    })
    updatedCount++
  }

  console.log(`  Reset ${updatedCount} inventory items to minimal stock levels`)
  console.log('')

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('='.repeat(60))
  console.log('Reset Complete')
  console.log('='.repeat(60))
  console.log('')
  console.log('Cleared:')
  console.log(`  - ${salesDeleted.count} sales`)
  console.log(`  - ${expensesDeleted.count} expenses`)
  console.log(`  - ${productionLogsDeleted.count} production logs`)
  console.log(`  - ${debtsDeleted.count} debts`)
  console.log(`  - ${bankTransactionsDeleted.count} bank transactions`)
  console.log(`  - ${stockMovementsDeleted.count} stock movements`)
  console.log('')
  console.log('Updated:')
  console.log(`  - ${users.length} user roles → RBAC`)
  console.log(`  - ${restaurants.length} restaurants → ${CONFIG.initialCapital.toLocaleString()} GNF capital`)
  console.log(`  - ${updatedCount} inventory items → minimal stock`)
  console.log('')
  console.log('Ready for testing!')
  console.log('')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
