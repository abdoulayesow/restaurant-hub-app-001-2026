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
  UserRole,
} from '@prisma/client'

const prisma = new PrismaClient()

// Helper to generate UUIDs
function genId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, '0')}`
}

// Helper to get date for a specific day in January 2026
function getJanDate(day: number): Date {
  return new Date(Date.UTC(2026, 0, day, 12, 0, 0))
}

// Helper to check if a day is weekend (Saturday = 6, Sunday = 0)
function isWeekend(day: number): boolean {
  const date = getJanDate(day)
  const dayOfWeek = date.getUTCDay()
  return dayOfWeek === 0 || dayOfWeek === 6
}

// Helper for random variation (±percentage)
function vary(base: number, percentage: number): number {
  const variation = 1 + (Math.random() * 2 - 1) * (percentage / 100)
  return Math.round(base * variation)
}

async function main() {
  console.log('='.repeat(60))
  console.log('Bliss Bakeries - Database Reseed')
  console.log('='.repeat(60))
  console.log('')

  // ============================================================================
  // PHASE 1: RESTAURANTS
  // ============================================================================
  console.log('Phase 1: Creating Restaurants...')

  const restaurant1 = await prisma.restaurant.upsert({
    where: { id: 'bliss-miniere' },
    update: {},
    create: {
      id: 'bliss-miniere',
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
    },
  })

  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: 'bliss-tahouyah' },
    update: {},
    create: {
      id: 'bliss-tahouyah',
      name: 'Bliss Tahouyah',
      location: 'Conakry - Tahouyah',
      currency: 'GNF',
      restaurantType: 'Bakery',
      initialCapital: 50000000,
      initialCashBalance: 5000000,
      initialOrangeBalance: 2000000,
      initialCardBalance: 1000000,
      contactPhone: '+224 620 10 00 02',
      managerName: 'Ibrahima Sow',
      trackingStartDate: new Date('2026-01-01'),
      isActive: true,
    },
  })

  const restaurants = [restaurant1, restaurant2]
  console.log(`  Created ${restaurants.length} restaurants`)

  // ============================================================================
  // PHASE 2: USERS & ASSIGNMENTS
  // ============================================================================
  console.log('Phase 2: Creating Users & Assignments...')

  // Define test users with their roles
  // Note: Users must login via Google OAuth first, then we assign roles
  const testUsers = [
    {
      email: 'abdoulaye.sow.1989@gmail.com',
      name: 'Abdoulaye Sow',
      globalRole: UserRole.Owner,
      restaurantRoles: [
        { restaurant: restaurant1, role: UserRole.Owner },
        { restaurant: restaurant2, role: UserRole.Owner },
      ],
      defaultRestaurant: restaurant1,
    },
    {
      email: 'abdoulaye.sow.co@gmail.com',
      name: 'Abdoulaye Sow (Manager Minière)',
      globalRole: UserRole.RestaurantManager,
      restaurantRoles: [
        { restaurant: restaurant1, role: UserRole.RestaurantManager },
      ],
      defaultRestaurant: restaurant1,
    },
    {
      email: 'abdoulaye.sow@friasoft.com',
      name: 'Abdoulaye Sow (Manager Tahouyah)',
      globalRole: UserRole.RestaurantManager,
      restaurantRoles: [
        { restaurant: restaurant2, role: UserRole.RestaurantManager },
      ],
      defaultRestaurant: restaurant2,
    },
  ]

  // Store the owner user for seeding data (used in Phase 9)
  let seedUser: { id: string; name: string | null } | null = null

  for (const userData of testUsers) {
    let user = await prisma.user.findUnique({
      where: { email: userData.email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.globalRole,
          defaultRestaurantId: userData.defaultRestaurant.id,
        },
      })
      console.log(`  Created user: ${user.email} (${userData.globalRole})`)
    } else {
      user = await prisma.user.update({
        where: { email: userData.email },
        data: {
          role: userData.globalRole,
          defaultRestaurantId: userData.defaultRestaurant.id,
        },
      })
      console.log(`  Updated user: ${user.email} (${userData.globalRole})`)
    }

    // Assign user to restaurants with specific roles
    for (const assignment of userData.restaurantRoles) {
      await prisma.userRestaurant.upsert({
        where: {
          userId_restaurantId: {
            userId: user.id,
            restaurantId: assignment.restaurant.id,
          },
        },
        update: { role: assignment.role },
        create: {
          userId: user.id,
          restaurantId: assignment.restaurant.id,
          role: assignment.role,
        },
      })
    }
    console.log(`    Assigned to ${userData.restaurantRoles.length} restaurant(s)`)

    // Store the owner user for seeding data
    if (userData.globalRole === UserRole.Owner && !seedUser) {
      seedUser = { id: user.id, name: user.name }
    }
  }

  // Ensure we have a seed user for creating data
  if (!seedUser) {
    throw new Error('No owner user found for seeding data')
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
  console.log(`  Created ${paymentMethods.length * restaurants.length} payment methods`)

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
  console.log(`  Created ${expenseGroups.length} expense groups, ${categories.length} categories`)

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
  console.log(`  Created ${suppliers.length} suppliers`)

  // ============================================================================
  // PHASE 6: INVENTORY ITEMS (10 per restaurant)
  // ============================================================================
  console.log('Phase 6: Creating Inventory Items...')

  const inventoryItemsTemplate = [
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

  let inventoryCount = 0
  for (const restaurant of restaurants) {
    for (let i = 0; i < inventoryItemsTemplate.length; i++) {
      const item = inventoryItemsTemplate[i]
      const itemId = `inv-${restaurant.id}-${String(i + 1).padStart(2, '0')}`
      await prisma.inventoryItem.upsert({
        where: { id: itemId },
        update: {},
        create: {
          id: itemId,
          restaurantId: restaurant.id,
          ...item,
        },
      })
      inventoryCount++
    }
  }
  console.log(`  Created ${inventoryCount} inventory items`)

  // ============================================================================
  // PHASE 7: PRODUCTS (16 per restaurant)
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

  const productIds: Record<string, Record<string, string>> = {}

  let productCount = 0
  for (const restaurant of restaurants) {
    productIds[restaurant.id] = {}
    for (let i = 0; i < productsTemplate.length; i++) {
      const product = productsTemplate[i]
      const productId = `prod-${restaurant.id}-${String(i + 1).padStart(2, '0')}`
      productIds[restaurant.id][product.name] = productId
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
  console.log(`  Created ${productCount} products`)

  // ============================================================================
  // PHASE 8: CUSTOMERS (3 per restaurant)
  // ============================================================================
  console.log('Phase 8: Creating Customers...')

  const customersTemplate = [
    { name: 'Hotel Noom', phone: '+224 620 99 99 01', email: 'commandes@hotelnoom.gn', company: 'Hotel Noom', customerType: CustomerType.Corporate, creditLimit: 10000000 },
    { name: 'Restaurant Le Damier', phone: '+224 620 88 88 01', email: 'chef@ledamier.gn', company: 'Le Damier', customerType: CustomerType.Wholesale, creditLimit: 5000000 },
    { name: 'Mariama Diallo', phone: '+224 620 77 77 01', email: null, company: null, customerType: CustomerType.Individual, creditLimit: 1000000 },
  ]

  const customerIds: Record<string, string[]> = {}

  let customerCount = 0
  for (const restaurant of restaurants) {
    customerIds[restaurant.id] = []
    for (let i = 0; i < customersTemplate.length; i++) {
      const cust = customersTemplate[i]
      const custId = `cust-${restaurant.id}-${String(i + 1).padStart(2, '0')}`
      customerIds[restaurant.id].push(custId)
      await prisma.customer.upsert({
        where: { id: custId },
        update: {},
        create: {
          id: custId,
          restaurantId: restaurant.id,
          name: cust.name,
          phone: cust.phone,
          email: cust.email,
          company: cust.company,
          customerType: cust.customerType,
          creditLimit: cust.creditLimit,
          isActive: true,
        },
      })
      customerCount++
    }
  }
  console.log(`  Created ${customerCount} customers`)

  // ============================================================================
  // PHASE 9: DAILY DATA (Jan 1-29, 2026)
  // ============================================================================
  console.log('Phase 9: Creating Daily Data (Jan 1-29)...')

  let saleCount = 0
  let productionLogCount = 0
  let productionItemCount = 0
  let stockMovementCount = 0
  let bankTxCount = 0

  // Daily production template (consistent products)
  const dailyProduction = [
    { productName: 'Baguette', baseQty: 120, flourKg: 30, butterKg: 0, yeastKg: 1.2, eggsUnit: 0, chocolateKg: 0 },
    { productName: 'Croissant', baseQty: 60, flourKg: 6, butterKg: 3, yeastKg: 0.3, eggsUnit: 12, chocolateKg: 0 },
    { productName: 'Pain au Chocolat', baseQty: 40, flourKg: 4.8, butterKg: 2.4, yeastKg: 0.2, eggsUnit: 8, chocolateKg: 1.2 },
    { productName: 'Petit Pain', baseQty: 100, flourKg: 8, butterKg: 0, yeastKg: 0.5, eggsUnit: 0, chocolateKg: 0 },
    { productName: 'Brioche', baseQty: 25, flourKg: 3.75, butterKg: 2, yeastKg: 0.15, eggsUnit: 50, chocolateKg: 0 },
  ]

  for (const restaurant of restaurants) {
    const flourItemId = `inv-${restaurant.id}-01`
    const butterItemId = `inv-${restaurant.id}-05`
    const yeastItemId = `inv-${restaurant.id}-03`
    const eggsItemId = `inv-${restaurant.id}-07`
    const chocolateItemId = `inv-${restaurant.id}-09`

    for (let day = 1; day <= 29; day++) {
      const date = getJanDate(day)
      const isToday = day === 29
      const isWknd = isWeekend(day)

      // ==== SALE ====
      const baseSales = isWknd ? 3500000 : 2500000
      const totalGNF = vary(baseSales, 15)
      const cashGNF = Math.round(totalGNF * (isWknd ? 0.57 : 0.60))
      const orangeMoneyGNF = Math.round(totalGNF * (isWknd ? 0.29 : 0.20))
      const cardGNF = totalGNF - cashGNF - orangeMoneyGNF

      const saleId = `sale-${restaurant.id}-day${String(day).padStart(2, '0')}`

      await prisma.sale.upsert({
        where: { id: saleId },
        update: {},
        create: {
          id: saleId,
          restaurantId: restaurant.id,
          date: date,
          totalGNF: totalGNF,
          cashGNF: cashGNF,
          orangeMoneyGNF: orangeMoneyGNF,
          cardGNF: cardGNF,
          itemsCount: vary(isWknd ? 450 : 350, 10),
          customersCount: vary(isWknd ? 150 : 110, 10),
          status: SubmissionStatus.Approved,
          submittedBy: seedUser.id,
          submittedByName: seedUser.name,
          approvedBy: seedUser.id,
          approvedByName: seedUser.name,
          approvedAt: date,
        },
      })
      saleCount++

      // ==== BANK TRANSACTION for Sale (Cash deposit) ====
      const bankSaleId = `bank-sale-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.bankTransaction.upsert({
        where: { id: bankSaleId },
        update: {},
        create: {
          id: bankSaleId,
          restaurantId: restaurant.id,
          date: date,
          amount: cashGNF,
          type: BankTransactionType.Deposit,
          method: BankPaymentMethod.Cash,
          reason: TransactionReason.SalesDeposit,
          saleId: saleId,
          description: `Daily sales deposit - Day ${day}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `DEP-${restaurant.id.slice(-3).toUpperCase()}-${String(day).padStart(3, '0')}`,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
        },
      })
      bankTxCount++

      // ==== PRODUCTION LOG ====
      const prodLogId = `prod-log-${restaurant.id}-day${String(day).padStart(2, '0')}`
      const ingredientDetails = dailyProduction.map((p) => {
        const qty = vary(p.baseQty, 20)
        return {
          product: p.productName,
          quantity: qty,
          flour: p.flourKg * (qty / p.baseQty),
          butter: p.butterKg * (qty / p.baseQty),
          yeast: p.yeastKg * (qty / p.baseQty),
          eggs: p.eggsUnit * (qty / p.baseQty),
          chocolate: p.chocolateKg * (qty / p.baseQty),
        }
      })

      const totalFlour = ingredientDetails.reduce((sum, d) => sum + d.flour, 0)
      const totalButter = ingredientDetails.reduce((sum, d) => sum + d.butter, 0)
      const totalYeast = ingredientDetails.reduce((sum, d) => sum + d.yeast, 0)
      const totalEggs = ingredientDetails.reduce((sum, d) => sum + d.eggs, 0)
      const totalChocolate = ingredientDetails.reduce((sum, d) => sum + d.chocolate, 0)

      const estimatedCost = Math.round(
        totalFlour * 8000 + totalButter * 35000 + totalYeast * 25000 + totalEggs * 1500 + totalChocolate * 45000
      )

      await prisma.productionLog.upsert({
        where: { id: prodLogId },
        update: {},
        create: {
          id: prodLogId,
          restaurantId: restaurant.id,
          date: date,
          productionType: ProductCategory.Boulangerie,
          productName: 'Daily Production',
          productNameFr: 'Production Quotidienne',
          quantity: ingredientDetails.reduce((sum, d) => sum + d.quantity, 0),
          ingredients: ['Wheat Flour', 'Butter', 'Yeast', 'Eggs', 'Chocolate'],
          ingredientDetails: [
            { itemId: flourItemId, itemName: 'Wheat Flour', quantity: totalFlour, unit: 'kg', unitCostGNF: 8000 },
            { itemId: butterItemId, itemName: 'Butter', quantity: totalButter, unit: 'kg', unitCostGNF: 35000 },
            { itemId: yeastItemId, itemName: 'Yeast', quantity: totalYeast, unit: 'kg', unitCostGNF: 25000 },
            { itemId: eggsItemId, itemName: 'Eggs', quantity: totalEggs, unit: 'unit', unitCostGNF: 1500 },
            { itemId: chocolateItemId, itemName: 'Chocolate', quantity: totalChocolate, unit: 'kg', unitCostGNF: 45000 },
          ],
          estimatedCostGNF: estimatedCost,
          preparationStatus: isToday ? ProductionStatus.Planning : ProductionStatus.Complete,
          status: isToday ? SubmissionStatus.Pending : SubmissionStatus.Approved,
          stockDeducted: !isToday,
          stockDeductedAt: isToday ? null : date,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
        },
      })
      productionLogCount++

      // ==== PRODUCTION ITEMS ====
      for (const prodData of ingredientDetails) {
        const productId = productIds[restaurant.id][prodData.product]
        if (productId) {
          const prodItemId = `prod-item-${restaurant.id}-day${String(day).padStart(2, '0')}-${prodData.product.toLowerCase().replace(/\s+/g, '-')}`
          await prisma.productionItem.upsert({
            where: { id: prodItemId },
            update: {},
            create: {
              id: prodItemId,
              productionLogId: prodLogId,
              productId: productId,
              quantity: prodData.quantity,
            },
          })
          productionItemCount++
        }
      }

      // ==== STOCK MOVEMENTS for Production (Usage) ====
      if (!isToday) {
        const movements = [
          { itemId: flourItemId, qty: -totalFlour, unit: 'kg', cost: 8000 },
          { itemId: butterItemId, qty: -totalButter, unit: 'kg', cost: 35000 },
          { itemId: yeastItemId, qty: -totalYeast, unit: 'kg', cost: 25000 },
          { itemId: eggsItemId, qty: -totalEggs, unit: 'unit', cost: 1500 },
          { itemId: chocolateItemId, qty: -totalChocolate, unit: 'kg', cost: 45000 },
        ]

        for (const mov of movements) {
          if (mov.qty !== 0) {
            const movId = `mov-usage-${restaurant.id}-day${String(day).padStart(2, '0')}-${mov.itemId.slice(-2)}`
            await prisma.stockMovement.upsert({
              where: { id: movId },
              update: {},
              create: {
                id: movId,
                restaurantId: restaurant.id,
                itemId: mov.itemId,
                type: 'Usage',
                quantity: mov.qty,
                unitCost: mov.cost,
                reason: `Production: Day ${day}`,
                productionLogId: prodLogId,
                createdBy: seedUser.id,
                createdByName: seedUser.name,
                createdAt: date,
              },
            })
            stockMovementCount++
          }
        }
      }
    }
  }
  console.log(`  Created ${saleCount} sales, ${productionLogCount} production logs, ${productionItemCount} production items`)
  console.log(`  Created ${stockMovementCount} stock movements (usage), ${bankTxCount} bank transactions (deposits)`)

  // ============================================================================
  // PHASE 10: EXPENSES (Every 2 days + weekly + bi-weekly)
  // ============================================================================
  console.log('Phase 10: Creating Expenses...')

  let expenseCount = 0
  let expensePaymentCount = 0

  // Find categories
  const flourCat = await prisma.category.findUnique({ where: { name: 'Flour' } })
  const dairyCat = await prisma.category.findUnique({ where: { name: 'Dairy' } })
  const electricityCat = await prisma.category.findUnique({ where: { name: 'Electricity' } })
  const salariesCat = await prisma.category.findUnique({ where: { name: 'Staff Salaries' } })
  const packagingCat = await prisma.category.findUnique({ where: { name: 'Packaging' } })

  for (const restaurant of restaurants) {
    // Inventory purchases every 2 days
    for (let day = 2; day <= 28; day += 2) {
      const date = getJanDate(day)
      const expId = `exp-inv-${restaurant.id}-day${String(day).padStart(2, '0')}`
      const amount = vary(2000000, 25)

      await prisma.expense.upsert({
        where: { id: expId },
        update: {},
        create: {
          id: expId,
          restaurantId: restaurant.id,
          date: date,
          categoryId: flourCat?.id,
          categoryName: 'Flour',
          amountGNF: amount,
          paymentMethod: 'Cash',
          description: `Inventory restock - Day ${day}`,
          isInventoryPurchase: true,
          status: SubmissionStatus.Approved,
          submittedBy: seedUser.id,
          submittedByName: seedUser.name,
          approvedBy: seedUser.id,
          approvedByName: seedUser.name,
          approvedAt: date,
          supplierId: 'sup-moulin-conakry',
          paymentStatus: PaymentStatus.Paid,
          totalPaidAmount: amount,
          fullyPaidAt: date,
        },
      })
      expenseCount++

      // Bank transaction for expense (withdrawal)
      const bankExpId = `bank-exp-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.bankTransaction.upsert({
        where: { id: bankExpId },
        update: {},
        create: {
          id: bankExpId,
          restaurantId: restaurant.id,
          date: date,
          amount: amount,
          type: BankTransactionType.Withdrawal,
          method: BankPaymentMethod.Cash,
          reason: TransactionReason.ExpensePayment,
          description: `Inventory purchase - Day ${day}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `WTH-${restaurant.id.slice(-3).toUpperCase()}-${String(day).padStart(3, '0')}`,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
        },
      })
      bankTxCount++

      // Expense payment record
      const expPayId = `exp-pay-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.expensePayment.upsert({
        where: { id: expPayId },
        update: {},
        create: {
          id: expPayId,
          expenseId: expId,
          amount: amount,
          paymentMethod: BankPaymentMethod.Cash,
          paidAt: date,
          bankTransactionId: bankExpId,
          paidBy: seedUser.id,
          paidByName: seedUser.name,
        },
      })
      expensePaymentCount++

      // Stock movement for purchase
      const flourItemId = `inv-${restaurant.id}-01`
      const purchaseMovId = `mov-purchase-${restaurant.id}-day${String(day).padStart(2, '0')}`
      const purchaseQty = Math.round(amount / 8000) // kg at 8000 GNF/kg
      await prisma.stockMovement.upsert({
        where: { id: purchaseMovId },
        update: {},
        create: {
          id: purchaseMovId,
          restaurantId: restaurant.id,
          itemId: flourItemId,
          type: 'Purchase',
          quantity: purchaseQty,
          unitCost: 8000,
          reason: `Restock - Day ${day}`,
          expenseId: expId,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
          createdAt: date,
        },
      })
      stockMovementCount++
    }

    // Weekly utilities (days 7, 14, 21, 28)
    for (const day of [7, 14, 21, 28]) {
      const date = getJanDate(day)
      const expId = `exp-util-${restaurant.id}-day${String(day).padStart(2, '0')}`
      const amount = vary(650000, 20)

      await prisma.expense.upsert({
        where: { id: expId },
        update: {},
        create: {
          id: expId,
          restaurantId: restaurant.id,
          date: date,
          categoryId: electricityCat?.id,
          categoryName: 'Electricity',
          amountGNF: amount,
          paymentMethod: 'Orange Money',
          description: `Utilities payment - Week ${Math.ceil(day / 7)}`,
          isInventoryPurchase: false,
          status: SubmissionStatus.Approved,
          submittedBy: seedUser.id,
          submittedByName: seedUser.name,
          approvedBy: seedUser.id,
          approvedByName: seedUser.name,
          approvedAt: date,
          supplierId: 'sup-edg',
          paymentStatus: PaymentStatus.Paid,
          totalPaidAmount: amount,
          fullyPaidAt: date,
        },
      })
      expenseCount++

      // Bank transaction (OrangeMoney withdrawal)
      const bankUtilId = `bank-util-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.bankTransaction.upsert({
        where: { id: bankUtilId },
        update: {},
        create: {
          id: bankUtilId,
          restaurantId: restaurant.id,
          date: date,
          amount: amount,
          type: BankTransactionType.Withdrawal,
          method: BankPaymentMethod.OrangeMoney,
          reason: TransactionReason.ExpensePayment,
          description: `Utilities - Week ${Math.ceil(day / 7)}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `UTL-${restaurant.id.slice(-3).toUpperCase()}-${String(day).padStart(3, '0')}`,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
        },
      })
      bankTxCount++

      // Expense payment
      const expPayUtilId = `exp-pay-util-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.expensePayment.upsert({
        where: { id: expPayUtilId },
        update: {},
        create: {
          id: expPayUtilId,
          expenseId: expId,
          amount: amount,
          paymentMethod: BankPaymentMethod.OrangeMoney,
          paidAt: date,
          bankTransactionId: bankUtilId,
          paidBy: seedUser.id,
          paidByName: seedUser.name,
        },
      })
      expensePaymentCount++
    }

    // Bi-weekly salaries (days 15, 29)
    for (const day of [15, 29]) {
      const date = getJanDate(day)
      const expId = `exp-sal-${restaurant.id}-day${String(day).padStart(2, '0')}`
      const amount = vary(3500000, 10)

      await prisma.expense.upsert({
        where: { id: expId },
        update: {},
        create: {
          id: expId,
          restaurantId: restaurant.id,
          date: date,
          categoryId: salariesCat?.id,
          categoryName: 'Staff Salaries',
          amountGNF: amount,
          paymentMethod: 'Cash',
          description: `Staff salaries - ${day === 15 ? 'Mid-month' : 'End of month'}`,
          isInventoryPurchase: false,
          status: SubmissionStatus.Approved,
          submittedBy: seedUser.id,
          submittedByName: seedUser.name,
          approvedBy: seedUser.id,
          approvedByName: seedUser.name,
          approvedAt: date,
          paymentStatus: PaymentStatus.Paid,
          totalPaidAmount: amount,
          fullyPaidAt: date,
        },
      })
      expenseCount++

      // Bank transaction
      const bankSalId = `bank-sal-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.bankTransaction.upsert({
        where: { id: bankSalId },
        update: {},
        create: {
          id: bankSalId,
          restaurantId: restaurant.id,
          date: date,
          amount: amount,
          type: BankTransactionType.Withdrawal,
          method: BankPaymentMethod.Cash,
          reason: TransactionReason.ExpensePayment,
          description: `Salaries - ${day === 15 ? 'Mid' : 'End'} month`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `SAL-${restaurant.id.slice(-3).toUpperCase()}-${String(day).padStart(3, '0')}`,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
        },
      })
      bankTxCount++

      // Expense payment
      const expPaySalId = `exp-pay-sal-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.expensePayment.upsert({
        where: { id: expPaySalId },
        update: {},
        create: {
          id: expPaySalId,
          expenseId: expId,
          amount: amount,
          paymentMethod: BankPaymentMethod.Cash,
          paidAt: date,
          bankTransactionId: bankSalId,
          paidBy: seedUser.id,
          paidByName: seedUser.name,
        },
      })
      expensePaymentCount++
    }

    // Weekly supplies (days 5, 12, 19, 26)
    for (const day of [5, 12, 19, 26]) {
      const date = getJanDate(day)
      const expId = `exp-sup-${restaurant.id}-day${String(day).padStart(2, '0')}`
      const amount = vary(450000, 30)

      await prisma.expense.upsert({
        where: { id: expId },
        update: {},
        create: {
          id: expId,
          restaurantId: restaurant.id,
          date: date,
          categoryId: packagingCat?.id,
          categoryName: 'Packaging',
          amountGNF: amount,
          paymentMethod: 'Card',
          description: `Supplies purchase - Week ${Math.ceil(day / 7)}`,
          isInventoryPurchase: false,
          status: SubmissionStatus.Approved,
          submittedBy: seedUser.id,
          submittedByName: seedUser.name,
          approvedBy: seedUser.id,
          approvedByName: seedUser.name,
          approvedAt: date,
          supplierId: 'sup-emballages-plus',
          paymentStatus: PaymentStatus.Paid,
          totalPaidAmount: amount,
          fullyPaidAt: date,
        },
      })
      expenseCount++

      // Bank transaction
      const bankSupId = `bank-sup-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.bankTransaction.upsert({
        where: { id: bankSupId },
        update: {},
        create: {
          id: bankSupId,
          restaurantId: restaurant.id,
          date: date,
          amount: amount,
          type: BankTransactionType.Withdrawal,
          method: BankPaymentMethod.Card,
          reason: TransactionReason.ExpensePayment,
          description: `Supplies - Week ${Math.ceil(day / 7)}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: date,
          bankRef: `SUP-${restaurant.id.slice(-3).toUpperCase()}-${String(day).padStart(3, '0')}`,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
        },
      })
      bankTxCount++

      // Expense payment
      const expPaySupId = `exp-pay-sup-${restaurant.id}-day${String(day).padStart(2, '0')}`
      await prisma.expensePayment.upsert({
        where: { id: expPaySupId },
        update: {},
        create: {
          id: expPaySupId,
          expenseId: expId,
          amount: amount,
          paymentMethod: BankPaymentMethod.Card,
          paidAt: date,
          bankTransactionId: bankSupId,
          paidBy: seedUser.id,
          paidByName: seedUser.name,
        },
      })
      expensePaymentCount++
    }
  }
  console.log(`  Created ${expenseCount} expenses, ${expensePaymentCount} expense payments`)

  // ============================================================================
  // PHASE 11: DEBTS & DEBT PAYMENTS
  // ============================================================================
  console.log('Phase 11: Creating Debts & Payments...')

  let debtCount = 0
  let debtPaymentCount = 0

  const debtsData = [
    // Restaurant 1 debts
    { restaurantIndex: 0, customerIndex: 0, principal: 5000000, paid: 0, status: DebtStatus.Outstanding, dueOffset: 7, desc: 'Weekly bread order' },
    { restaurantIndex: 0, customerIndex: 0, principal: 3000000, paid: 1500000, status: DebtStatus.PartiallyPaid, dueOffset: 3, desc: 'Catering order' },
    { restaurantIndex: 0, customerIndex: 1, principal: 2000000, paid: 2000000, status: DebtStatus.FullyPaid, dueOffset: -5, desc: 'Event pastries' },
    { restaurantIndex: 0, customerIndex: 1, principal: 1500000, paid: 500000, status: DebtStatus.Overdue, dueOffset: -10, desc: 'Monthly order' },
    { restaurantIndex: 0, customerIndex: 2, principal: 500000, paid: 0, status: DebtStatus.Outstanding, dueOffset: 14, desc: 'Wedding cake' },
    { restaurantIndex: 0, customerIndex: 2, principal: 300000, paid: 300000, status: DebtStatus.FullyPaid, dueOffset: -3, desc: 'Birthday order' },
    // Restaurant 2 debts (similar pattern)
    { restaurantIndex: 1, customerIndex: 0, principal: 4500000, paid: 0, status: DebtStatus.Outstanding, dueOffset: 5, desc: 'Hotel order' },
    { restaurantIndex: 1, customerIndex: 0, principal: 2500000, paid: 1000000, status: DebtStatus.PartiallyPaid, dueOffset: 2, desc: 'Conference catering' },
    { restaurantIndex: 1, customerIndex: 1, principal: 1800000, paid: 1800000, status: DebtStatus.FullyPaid, dueOffset: -7, desc: 'Restaurant supply' },
    { restaurantIndex: 1, customerIndex: 1, principal: 1200000, paid: 400000, status: DebtStatus.Overdue, dueOffset: -12, desc: 'Weekly supply' },
    { restaurantIndex: 1, customerIndex: 2, principal: 400000, paid: 0, status: DebtStatus.Outstanding, dueOffset: 10, desc: 'Party order' },
    { restaurantIndex: 1, customerIndex: 2, principal: 250000, paid: 250000, status: DebtStatus.FullyPaid, dueOffset: -2, desc: 'Regular order' },
  ]

  for (let i = 0; i < debtsData.length; i++) {
    const d = debtsData[i]
    const restaurant = restaurants[d.restaurantIndex]
    const customerId = customerIds[restaurant.id][d.customerIndex]
    const debtId = `debt-${restaurant.id}-${String(i + 1).padStart(2, '0')}`

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + d.dueOffset)

    await prisma.debt.upsert({
      where: { id: debtId },
      update: {},
      create: {
        id: debtId,
        restaurantId: restaurant.id,
        customerId: customerId,
        principalAmount: d.principal,
        paidAmount: d.paid,
        remainingAmount: d.principal - d.paid,
        status: d.status,
        dueDate: dueDate,
        description: d.desc,
        createdBy: seedUser.id,
        createdByName: seedUser.name,
      },
    })
    debtCount++

    // Create payments for debts with paid > 0
    if (d.paid > 0) {
      const paymentDate = getJanDate(Math.max(1, 29 + d.dueOffset - 5)) // A few days before due
      const paymentId = `debt-pay-${restaurant.id}-${String(i + 1).padStart(2, '0')}`
      const paymentMethod = d.status === DebtStatus.FullyPaid ? 'Cash' : 'Orange Money'

      // Create debt payment FIRST (before bank transaction that references it)
      await prisma.debtPayment.upsert({
        where: { id: paymentId },
        update: {},
        create: {
          id: paymentId,
          restaurantId: restaurant.id,
          debtId: debtId,
          customerId: customerId,
          amount: d.paid,
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
          receiptNumber: `REC-${restaurant.id.slice(-3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          notes: d.status === DebtStatus.FullyPaid ? 'Full payment received' : 'Partial payment',
          receivedBy: seedUser.id,
          receivedByName: seedUser.name,
        },
      })
      debtPaymentCount++

      // Create bank transaction for debt collection (references the debt payment)
      const bankDebtId = `bank-debt-${restaurant.id}-${String(i + 1).padStart(2, '0')}`
      await prisma.bankTransaction.upsert({
        where: { id: bankDebtId },
        update: {},
        create: {
          id: bankDebtId,
          restaurantId: restaurant.id,
          date: paymentDate,
          amount: d.paid,
          type: BankTransactionType.Deposit,
          method: paymentMethod === 'Cash' ? BankPaymentMethod.Cash : BankPaymentMethod.OrangeMoney,
          reason: TransactionReason.DebtCollection,
          debtPaymentId: paymentId,
          description: `Debt collection: ${d.desc}`,
          status: BankTransactionStatus.Confirmed,
          confirmedAt: paymentDate,
          bankRef: `DEB-${restaurant.id.slice(-3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
          createdBy: seedUser.id,
          createdByName: seedUser.name,
        },
      })
      bankTxCount++
    }
  }
  console.log(`  Created ${debtCount} debts, ${debtPaymentCount} debt payments`)

  // ============================================================================
  // PHASE 12: CAPITAL INJECTIONS & OWNER WITHDRAWALS
  // ============================================================================
  console.log('Phase 12: Creating Capital Movements...')

  for (const restaurant of restaurants) {
    // Initial capital injection (Jan 1)
    const capitalId = `bank-capital-${restaurant.id}`
    await prisma.bankTransaction.upsert({
      where: { id: capitalId },
      update: {},
      create: {
        id: capitalId,
        restaurantId: restaurant.id,
        date: getJanDate(1),
        amount: 10000000,
        type: BankTransactionType.Deposit,
        method: BankPaymentMethod.Cash,
        reason: TransactionReason.CapitalInjection,
        description: 'Owner capital injection - January startup',
        status: BankTransactionStatus.Confirmed,
        confirmedAt: getJanDate(1),
        bankRef: `CAP-${restaurant.id.slice(-3).toUpperCase()}-001`,
        createdBy: seedUser.id,
        createdByName: seedUser.name,
      },
    })
    bankTxCount++

    // Owner withdrawal (mid-month)
    const withdrawalId = `bank-withdrawal-${restaurant.id}`
    await prisma.bankTransaction.upsert({
      where: { id: withdrawalId },
      update: {},
      create: {
        id: withdrawalId,
        restaurantId: restaurant.id,
        date: getJanDate(15),
        amount: 5000000,
        type: BankTransactionType.Withdrawal,
        method: BankPaymentMethod.Cash,
        reason: TransactionReason.OwnerWithdrawal,
        description: 'Owner withdrawal - Mid-month',
        status: BankTransactionStatus.Confirmed,
        confirmedAt: getJanDate(15),
        bankRef: `OWN-${restaurant.id.slice(-3).toUpperCase()}-001`,
        createdBy: seedUser.id,
        createdByName: seedUser.name,
      },
    })
    bankTxCount++
  }
  console.log(`  Created capital injections and owner withdrawals`)

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('')
  console.log('='.repeat(60))
  console.log('SEED COMPLETED SUCCESSFULLY')
  console.log('='.repeat(60))
  console.log('')
  console.log('Data Summary:')
  console.log(`  Restaurants: ${restaurants.length}`)
  console.log(`    - ${restaurant1.name} (${restaurant1.location})`)
  console.log(`    - ${restaurant2.name} (${restaurant2.location})`)
  console.log(`  Seed User: ${seedUser.name || 'Unknown'} (Owner)`)
  console.log(`  Payment Methods: ${paymentMethods.length * restaurants.length}`)
  console.log(`  Expense Groups: ${expenseGroups.length}`)
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Suppliers: ${suppliers.length}`)
  console.log(`  Inventory Items: ${inventoryCount}`)
  console.log(`  Products: ${productCount}`)
  console.log(`  Customers: ${customerCount}`)
  console.log(`  Sales: ${saleCount}`)
  console.log(`  Production Logs: ${productionLogCount}`)
  console.log(`  Production Items: ${productionItemCount}`)
  console.log(`  Stock Movements: ${stockMovementCount}`)
  console.log(`  Expenses: ${expenseCount}`)
  console.log(`  Expense Payments: ${expensePaymentCount}`)
  console.log(`  Debts: ${debtCount}`)
  console.log(`  Debt Payments: ${debtPaymentCount}`)
  console.log(`  Bank Transactions: ${bankTxCount}`)
  console.log('')
  console.log('Initial Balances per Restaurant:')
  console.log(`  Cash: 5,000,000 GNF`)
  console.log(`  Orange Money: 2,000,000 GNF`)
  console.log(`  Card: 1,000,000 GNF`)
  console.log(`  Initial Capital: 50,000,000 GNF`)
  console.log('')
  console.log('Next Steps:')
  console.log('  1. Start dev server: npm run dev')
  console.log('  2. Check Bank page: /finances/bank')
  console.log('  3. Check Sales page: /finances/sales')
  console.log('  4. Check Debts page: /finances/debts')
  console.log('  5. Check Production page: /baking/production')
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
