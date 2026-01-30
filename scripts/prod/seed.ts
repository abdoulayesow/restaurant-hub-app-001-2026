/**
 * Production Seed Script for Bliss Bakeries
 *
 * This script creates a clean database for client delivery:
 * - Restaurants with minimal initial capital (1,000,000 GNF)
 * - Owner user assignment (user must login via OAuth first)
 * - Payment methods (Cash, Orange Money, Card)
 * - Expense groups & categories
 * - Suppliers
 * - Inventory items with minimal stock
 * - Products catalog
 * - NO financial transactions (sales, expenses, debts)
 * - NO production logs
 *
 * Usage:
 *   npx tsx scripts/prod/seed.ts
 *
 * Prerequisites:
 *   - Owner must have logged in via Google OAuth first
 *   - Database should be migrated: npx prisma migrate deploy
 */

import {
  PrismaClient,
  ProductCategory,
  UserRole,
} from '@prisma/client'

const prisma = new PrismaClient()

// Configuration - adjust for your client
const CONFIG = {
  ownerEmail: 'abdoulaye.sow.1989@gmail.com',
  ownerName: 'Abdoulaye Sow',
  initialCapital: 1000000, // 1,000,000 GNF
  initialCashBalance: 500000,
  initialOrangeBalance: 300000,
  initialCardBalance: 200000,
}

async function main() {
  console.log('='.repeat(60))
  console.log('Bliss Bakeries - Production Database Setup')
  console.log('='.repeat(60))
  console.log('')
  console.log(`Initial Capital: ${CONFIG.initialCapital.toLocaleString()} GNF`)
  console.log('')

  // ============================================================================
  // PHASE 1: RESTAURANTS
  // ============================================================================
  console.log('Phase 1: Creating Restaurants...')

  const restaurant1 = await prisma.restaurant.upsert({
    where: { id: 'bliss-miniere' },
    update: {
      initialCapital: CONFIG.initialCapital,
      initialCashBalance: CONFIG.initialCashBalance,
      initialOrangeBalance: CONFIG.initialOrangeBalance,
      initialCardBalance: CONFIG.initialCardBalance,
    },
    create: {
      id: 'bliss-miniere',
      name: 'Bliss Minière',
      location: 'Conakry - Minière',
      currency: 'GNF',
      restaurantType: 'Bakery',
      initialCapital: CONFIG.initialCapital,
      initialCashBalance: CONFIG.initialCashBalance,
      initialOrangeBalance: CONFIG.initialOrangeBalance,
      initialCardBalance: CONFIG.initialCardBalance,
      contactPhone: '+224 620 10 00 01',
      managerName: 'Aminata Camara',
      trackingStartDate: new Date(),
      isActive: true,
    },
  })

  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: 'bliss-tahouyah' },
    update: {
      initialCapital: CONFIG.initialCapital,
      initialCashBalance: CONFIG.initialCashBalance,
      initialOrangeBalance: CONFIG.initialOrangeBalance,
      initialCardBalance: CONFIG.initialCardBalance,
    },
    create: {
      id: 'bliss-tahouyah',
      name: 'Bliss Tahouyah',
      location: 'Conakry - Tahouyah',
      currency: 'GNF',
      restaurantType: 'Bakery',
      initialCapital: CONFIG.initialCapital,
      initialCashBalance: CONFIG.initialCashBalance,
      initialOrangeBalance: CONFIG.initialOrangeBalance,
      initialCardBalance: CONFIG.initialCardBalance,
      contactPhone: '+224 620 10 00 02',
      managerName: 'Ibrahima Sow',
      trackingStartDate: new Date(),
      isActive: true,
    },
  })

  const restaurants = [restaurant1, restaurant2]
  console.log(`  ✓ Created ${restaurants.length} restaurants`)

  // ============================================================================
  // PHASE 2: OWNER USER ASSIGNMENT
  // ============================================================================
  console.log('Phase 2: Setting up Owner User...')

  const owner = await prisma.user.findUnique({
    where: { email: CONFIG.ownerEmail },
  })

  if (!owner) {
    console.log(`  ⚠️  Owner user not found: ${CONFIG.ownerEmail}`)
    console.log('     The owner must login via Google OAuth first.')
    console.log('     Add their email to ALLOWED_EMAILS in .env, then have them login.')
  } else {
    // Update owner's global role and default restaurant
    await prisma.user.update({
      where: { id: owner.id },
      data: {
        role: UserRole.Owner,
        defaultRestaurantId: restaurant1.id,
      },
    })

    // Assign owner to both restaurants
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
    console.log(`  ✓ Assigned ${owner.email} as Owner to all restaurants`)
  }

  // ============================================================================
  // PHASE 3: PAYMENT METHODS
  // ============================================================================
  console.log('Phase 3: Creating Payment Methods...')

  const paymentMethods = [
    { name: 'Cash', nameFr: 'Espèces', type: 'cash', icon: 'Banknote', color: '#10B981', sortOrder: 1 },
    { name: 'Orange Money', nameFr: 'Orange Money', type: 'mobile_money', icon: 'Smartphone', color: '#FF6600', sortOrder: 2 },
    { name: 'Card', nameFr: 'Carte', type: 'card', icon: 'CreditCard', color: '#3B82F6', sortOrder: 3 },
  ]

  for (const restaurant of restaurants) {
    for (const pm of paymentMethods) {
      await prisma.paymentMethod.upsert({
        where: {
          restaurantId_name: {
            restaurantId: restaurant.id,
            name: pm.name,
          },
        },
        update: {},
        create: {
          restaurantId: restaurant.id,
          name: pm.name,
          nameFr: pm.nameFr,
          type: pm.type,
          icon: pm.icon,
          color: pm.color,
          sortOrder: pm.sortOrder,
        },
      })
    }
  }
  console.log(`  ✓ Created ${paymentMethods.length * restaurants.length} payment methods`)

  // ============================================================================
  // PHASE 4: EXPENSE GROUPS & CATEGORIES
  // ============================================================================
  console.log('Phase 4: Creating Expense Groups & Categories...')

  const expenseGroups = [
    { id: 'exp-group-ingredients', key: 'ingredients', label: 'Ingredients', labelFr: 'Ingrédients', icon: 'Package', color: '#22c55e', sortOrder: 1 },
    { id: 'exp-group-utilities', key: 'utilities', label: 'Utilities', labelFr: 'Services', icon: 'Zap', color: '#3b82f6', sortOrder: 2 },
    { id: 'exp-group-salaries', key: 'salaries', label: 'Salaries', labelFr: 'Salaires', icon: 'Users', color: '#a855f7', sortOrder: 3 },
    { id: 'exp-group-supplies', key: 'supplies', label: 'Supplies', labelFr: 'Fournitures', icon: 'Box', color: '#f97316', sortOrder: 4 },
    { id: 'exp-group-maintenance', key: 'maintenance', label: 'Maintenance', labelFr: 'Entretien', icon: 'Wrench', color: '#06b6d4', sortOrder: 5 },
    { id: 'exp-group-other', key: 'other', label: 'Other', labelFr: 'Autres', icon: 'MoreHorizontal', color: '#6b7280', sortOrder: 6 },
  ]

  for (const group of expenseGroups) {
    await prisma.expenseGroup.upsert({
      where: { key: group.key },
      update: {},
      create: group,
    })
  }

  const categories = [
    { id: 'cat-flour', name: 'Flour', nameFr: 'Farine', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-butter', name: 'Butter', nameFr: 'Beurre', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-sugar', name: 'Sugar', nameFr: 'Sucre', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-eggs', name: 'Eggs', nameFr: 'Oeufs', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-dairy', name: 'Dairy', nameFr: 'Produits laitiers', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-other-ingredients', name: 'Other Ingredients', nameFr: 'Autres ingrédients', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-electricity', name: 'Electricity', nameFr: 'Électricité', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-water', name: 'Water', nameFr: 'Eau', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-gas', name: 'Gas', nameFr: 'Gaz', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-staff-salaries', name: 'Staff Salaries', nameFr: 'Salaires du personnel', color: '#a855f7', expenseGroupKey: 'salaries' },
    { id: 'cat-packaging', name: 'Packaging', nameFr: 'Emballages', color: '#f97316', expenseGroupKey: 'supplies' },
    { id: 'cat-cleaning', name: 'Cleaning', nameFr: 'Nettoyage', color: '#06b6d4', expenseGroupKey: 'maintenance' },
    { id: 'cat-equipment', name: 'Equipment', nameFr: 'Équipement', color: '#06b6d4', expenseGroupKey: 'maintenance' },
    { id: 'cat-miscellaneous', name: 'Miscellaneous', nameFr: 'Divers', color: '#6b7280', expenseGroupKey: 'other' },
  ]

  for (const cat of categories) {
    const group = await prisma.expenseGroup.findUnique({ where: { key: cat.expenseGroupKey } })
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        nameFr: cat.nameFr,
        color: cat.color,
        expenseGroupId: group?.id,
      },
    })
  }
  console.log(`  ✓ Created ${expenseGroups.length} expense groups, ${categories.length} categories`)

  // ============================================================================
  // PHASE 5: SUPPLIERS
  // ============================================================================
  console.log('Phase 5: Creating Suppliers...')

  const suppliers = [
    { id: 'sup-moulin-conakry', name: 'Moulin de Conakry', phone: '+224 622 11 11 11', email: 'contact@moulin-conakry.gn', address: 'Conakry, Centre-ville' },
    { id: 'sup-laiterie-nationale', name: 'Laiterie Nationale', phone: '+224 622 22 22 22', email: 'ventes@laiterie.gn', address: 'Conakry, Zone Industrielle' },
    { id: 'sup-emballages-plus', name: 'Emballages Plus', phone: '+224 622 33 33 33', email: 'commandes@emballages.gn', address: 'Conakry, Matoto' },
    { id: 'sup-edg', name: 'Electricité de Guinée (EDG)', phone: '+224 622 44 44 44', email: null, address: 'Conakry' },
    { id: 'sup-seg', name: 'SEG (Société des Eaux)', phone: '+224 622 55 55 55', email: null, address: 'Conakry' },
  ]

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { name: sup.name },
      update: {},
      create: sup,
    })
  }
  console.log(`  ✓ Created ${suppliers.length} suppliers`)

  // ============================================================================
  // PHASE 6: INVENTORY ITEMS (Minimal Stock)
  // ============================================================================
  console.log('Phase 6: Creating Inventory Items (minimal stock)...')

  // Minimal stock - just enough to show the system works
  const inventoryItemsTemplate = [
    { name: 'Wheat Flour', nameFr: 'Farine de blé', category: 'dry_goods', unit: 'kg', currentStock: 10, minStock: 50, reorderPoint: 100, unitCostGNF: 8000 },
    { name: 'Sugar', nameFr: 'Sucre', category: 'dry_goods', unit: 'kg', currentStock: 5, minStock: 30, reorderPoint: 60, unitCostGNF: 6000 },
    { name: 'Yeast', nameFr: 'Levure', category: 'dry_goods', unit: 'kg', currentStock: 2, minStock: 5, reorderPoint: 10, unitCostGNF: 25000 },
    { name: 'Salt', nameFr: 'Sel', category: 'dry_goods', unit: 'kg', currentStock: 3, minStock: 10, reorderPoint: 15, unitCostGNF: 2000 },
    { name: 'Butter', nameFr: 'Beurre', category: 'dairy', unit: 'kg', currentStock: 5, minStock: 20, reorderPoint: 40, unitCostGNF: 35000 },
    { name: 'Milk', nameFr: 'Lait', category: 'dairy', unit: 'L', currentStock: 5, minStock: 15, reorderPoint: 30, unitCostGNF: 12000 },
    { name: 'Eggs', nameFr: 'Oeufs', category: 'dairy', unit: 'unit', currentStock: 20, minStock: 50, reorderPoint: 100, unitCostGNF: 1500 },
    { name: 'Vanilla Extract', nameFr: 'Extrait de Vanille', category: 'flavorings', unit: 'L', currentStock: 1, minStock: 2, reorderPoint: 3, unitCostGNF: 80000 },
    { name: 'Chocolate', nameFr: 'Chocolat', category: 'flavorings', unit: 'kg', currentStock: 2, minStock: 5, reorderPoint: 10, unitCostGNF: 45000 },
    { name: 'Pastry Boxes', nameFr: 'Boîtes à pâtisserie', category: 'packaging', unit: 'unit', currentStock: 30, minStock: 100, reorderPoint: 150, unitCostGNF: 500 },
  ]

  let inventoryCount = 0
  for (const restaurant of restaurants) {
    for (let i = 0; i < inventoryItemsTemplate.length; i++) {
      const item = inventoryItemsTemplate[i]
      const itemId = `inv-${restaurant.id}-${String(i + 1).padStart(2, '0')}`
      await prisma.inventoryItem.upsert({
        where: { id: itemId },
        update: {
          currentStock: item.currentStock, // Update to minimal stock
        },
        create: {
          id: itemId,
          restaurantId: restaurant.id,
          ...item,
        },
      })
      inventoryCount++
    }
  }
  console.log(`  ✓ Created ${inventoryCount} inventory items (minimal stock levels)`)

  // ============================================================================
  // PHASE 7: PRODUCTS
  // ============================================================================
  console.log('Phase 7: Creating Products...')

  const productsTemplate = [
    // Patisserie (8)
    { name: 'Croissant', nameFr: 'Croissant', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 1 },
    { name: 'Pain au Chocolat', nameFr: 'Pain au Chocolat', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 2 },
    { name: 'Eclair', nameFr: 'Éclair', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 3 },
    { name: 'Fruit Tart', nameFr: 'Tarte aux Fruits', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 4 },
    { name: 'Mille-feuille', nameFr: 'Mille-feuille', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 5 },
    { name: 'Macaron', nameFr: 'Macaron', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 6 },
    { name: 'Brioche', nameFr: 'Brioche', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 7 },
    { name: 'Apple Turnover', nameFr: 'Chausson aux Pommes', category: ProductCategory.Patisserie, unit: 'piece', sortOrder: 8 },
    // Boulangerie (8)
    { name: 'Baguette', nameFr: 'Baguette', category: ProductCategory.Boulangerie, unit: 'piece', sortOrder: 1 },
    { name: 'Sandwich Bread', nameFr: 'Pain de Mie', category: ProductCategory.Boulangerie, unit: 'loaf', sortOrder: 2 },
    { name: 'Whole Wheat Bread', nameFr: 'Pain Complet', category: ProductCategory.Boulangerie, unit: 'loaf', sortOrder: 3 },
    { name: 'Fougasse', nameFr: 'Fougasse', category: ProductCategory.Boulangerie, unit: 'piece', sortOrder: 4 },
    { name: 'Multigrain Bread', nameFr: 'Pain aux Céréales', category: ProductCategory.Boulangerie, unit: 'loaf', sortOrder: 5 },
    { name: 'Country Bread', nameFr: 'Pain de Campagne', category: ProductCategory.Boulangerie, unit: 'loaf', sortOrder: 6 },
    { name: 'Petit Pain', nameFr: 'Petit Pain', category: ProductCategory.Boulangerie, unit: 'piece', sortOrder: 7 },
    { name: 'Vienna Bread', nameFr: 'Pain Viennois', category: ProductCategory.Boulangerie, unit: 'piece', sortOrder: 8 },
  ]

  let productCount = 0
  for (const restaurant of restaurants) {
    for (let i = 0; i < productsTemplate.length; i++) {
      const product = productsTemplate[i]
      const productId = `prod-${restaurant.id}-${String(i + 1).padStart(2, '0')}`
      await prisma.product.upsert({
        where: { id: productId },
        update: {},
        create: {
          id: productId,
          restaurantId: restaurant.id,
          name: product.name,
          nameFr: product.nameFr,
          category: product.category,
          unit: product.unit,
          sortOrder: product.sortOrder,
          isActive: true,
        },
      })
      productCount++
    }
  }
  console.log(`  ✓ Created ${productCount} products`)

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('')
  console.log('='.repeat(60))
  console.log('Production Database Setup Complete')
  console.log('='.repeat(60))
  console.log('')
  console.log('Summary:')
  console.log(`  Restaurants: ${restaurants.length}`)
  console.log(`    - ${restaurant1.name} (${restaurant1.location})`)
  console.log(`    - ${restaurant2.name} (${restaurant2.location})`)
  console.log(`  Initial Capital: ${CONFIG.initialCapital.toLocaleString()} GNF per restaurant`)
  console.log(`  Payment Methods: ${paymentMethods.length * restaurants.length}`)
  console.log(`  Expense Groups: ${expenseGroups.length}`)
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Suppliers: ${suppliers.length}`)
  console.log(`  Inventory Items: ${inventoryCount} (minimal stock)`)
  console.log(`  Products: ${productCount}`)
  console.log('')
  console.log('Ready for:')
  console.log('  - Sales entry')
  console.log('  - Production logging')
  console.log('  - Expense tracking')
  console.log('  - Inventory management')
  console.log('')
  console.log('NO test data created:')
  console.log('  - No sales')
  console.log('  - No expenses')
  console.log('  - No production logs')
  console.log('  - No debts')
  console.log('  - No bank transactions')
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
