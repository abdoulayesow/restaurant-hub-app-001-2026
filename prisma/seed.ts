import { PrismaClient, ProductionStatus, SubmissionStatus, ProductCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create restaurants
  const restaurant1 = await prisma.restaurant.upsert({
    where: { id: 'bakery-conakry-main' },
    update: {},
    create: {
      id: 'bakery-conakry-main',
      name: 'Boulangerie Centrale',
      location: 'Conakry - Centre',
      currency: 'GNF',
      restaurantType: 'Bakery',
      initialCapital: 50000000,
      initialCashBalance: 5000000,
      initialOrangeBalance: 1000000,
      initialCardBalance: 500000,
      contactPhone: '+224 620 00 00 00',
      managerName: 'Abdoulaye Sow',
      trackingStartDate: new Date('2026-01-01'),
      isActive: true,
    },
  })
  console.log('✅ Created restaurant:', restaurant1.name)

  const restaurant2 = await prisma.restaurant.upsert({
    where: { id: 'bakery-kaloum' },
    update: {},
    create: {
      id: 'bakery-kaloum',
      name: 'Boulangerie Kaloum',
      location: 'Conakry - Kaloum',
      currency: 'GNF',
      restaurantType: 'Bakery',
      initialCapital: 35000000,
      initialCashBalance: 3000000,
      initialOrangeBalance: 800000,
      initialCardBalance: 400000,
      contactPhone: '+224 620 11 11 11',
      managerName: 'Mariama Diallo',
      trackingStartDate: new Date('2026-01-01'),
      isActive: true,
    },
  })
  console.log('✅ Created restaurant:', restaurant2.name)

  const restaurant3 = await prisma.restaurant.upsert({
    where: { id: 'bakery-ratoma' },
    update: {},
    create: {
      id: 'bakery-ratoma',
      name: 'Boulangerie Ratoma',
      location: 'Conakry - Ratoma',
      currency: 'GNF',
      restaurantType: 'Bakery',
      initialCapital: 40000000,
      initialCashBalance: 4000000,
      initialOrangeBalance: 900000,
      initialCardBalance: 450000,
      contactPhone: '+224 620 22 22 22',
      managerName: 'Ibrahima Camara',
      trackingStartDate: new Date('2026-01-01'),
      isActive: true,
    },
  })
  console.log('✅ Created restaurant:', restaurant3.name)

  // Use first restaurant as the main one for inventory
  const restaurant = restaurant1

  // Find or create the user (will be created by NextAuth on first login)
  // This ensures the user exists and is assigned to the restaurant
  const userEmail = process.env.SEED_USER_EMAIL || 'abdoulaye.sow.1989@gmail.com'

  let user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: userEmail,
        name: 'Abdoulaye Sow',
        role: 'Manager',
      },
    })
    console.log('✅ Created user:', user.email)
  } else {
    // Update role to Manager if needed
    user = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'Manager' },
    })
    console.log('✅ Updated user role:', user.email)
  }

  // Assign user to all bakeries
  await prisma.userRestaurant.upsert({
    where: {
      userId_restaurantId: {
        userId: user.id,
        restaurantId: restaurant1.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      restaurantId: restaurant1.id,
    },
  })

  await prisma.userRestaurant.upsert({
    where: {
      userId_restaurantId: {
        userId: user.id,
        restaurantId: restaurant2.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      restaurantId: restaurant2.id,
    },
  })

  await prisma.userRestaurant.upsert({
    where: {
      userId_restaurantId: {
        userId: user.id,
        restaurantId: restaurant3.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      restaurantId: restaurant3.id,
    },
  })
  console.log('✅ Assigned user to 3 bakeries')

  // Set default bakery for user
  await prisma.user.update({
    where: { id: user.id },
    data: { defaultRestaurantId: restaurant.id },
  })
  console.log('✅ Set default bakery for user')

  // Create default payment methods for all restaurants
  const restaurants = [restaurant1, restaurant2, restaurant3]
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
  console.log('✅ Created payment methods for all restaurants')

  // Create products for all restaurants
  const products = [
    // Patisserie products
    {
      id: 'prod-croissant',
      name: 'Croissant',
      nameFr: 'Croissant',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 1,
    },
    {
      id: 'prod-pain-chocolat',
      name: 'Chocolate Croissant',
      nameFr: 'Pain au Chocolat',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 2,
    },
    {
      id: 'prod-chausson-pomme',
      name: 'Apple Turnover',
      nameFr: 'Chausson aux Pommes',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 3,
    },
    {
      id: 'prod-pain-raisin',
      name: 'Raisin Roll',
      nameFr: 'Pain aux Raisins',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 4,
    },
    {
      id: 'prod-brioche',
      name: 'Brioche',
      nameFr: 'Brioche',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 5,
    },
    {
      id: 'prod-eclair',
      name: 'Eclair',
      nameFr: 'Éclair',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 6,
    },
    {
      id: 'prod-tarte-citron',
      name: 'Lemon Tart',
      nameFr: 'Tarte au Citron',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 7,
    },
    {
      id: 'prod-mille-feuille',
      name: 'Mille-feuille',
      nameFr: 'Mille-feuille',
      category: ProductCategory.Patisserie,
      unit: 'piece',
      sortOrder: 8,
    },
    // Boulangerie products
    {
      id: 'prod-baguette',
      name: 'Baguette',
      nameFr: 'Baguette',
      category: ProductCategory.Boulangerie,
      unit: 'piece',
      sortOrder: 1,
    },
    {
      id: 'prod-pain-complet',
      name: 'Whole Wheat Bread',
      nameFr: 'Pain Complet',
      category: ProductCategory.Boulangerie,
      unit: 'loaf',
      sortOrder: 2,
    },
    {
      id: 'prod-pain-campagne',
      name: 'Country Bread',
      nameFr: 'Pain de Campagne',
      category: ProductCategory.Boulangerie,
      unit: 'loaf',
      sortOrder: 3,
    },
    {
      id: 'prod-pain-mie',
      name: 'Sandwich Bread',
      nameFr: 'Pain de Mie',
      category: ProductCategory.Boulangerie,
      unit: 'loaf',
      sortOrder: 4,
    },
    {
      id: 'prod-ficelle',
      name: 'Ficelle',
      nameFr: 'Ficelle',
      category: ProductCategory.Boulangerie,
      unit: 'piece',
      sortOrder: 5,
    },
    {
      id: 'prod-pain-cereales',
      name: 'Multigrain Bread',
      nameFr: 'Pain aux Céréales',
      category: ProductCategory.Boulangerie,
      unit: 'loaf',
      sortOrder: 6,
    },
    {
      id: 'prod-fougasse',
      name: 'Fougasse',
      nameFr: 'Fougasse',
      category: ProductCategory.Boulangerie,
      unit: 'piece',
      sortOrder: 7,
    },
    {
      id: 'prod-pain-seigle',
      name: 'Rye Bread',
      nameFr: 'Pain de Seigle',
      category: ProductCategory.Boulangerie,
      unit: 'loaf',
      sortOrder: 8,
    },
  ]

  for (const restaurant of restaurants) {
    for (const product of products) {
      await prisma.product.upsert({
        where: {
          id: `${product.id}-${restaurant.id}`,
        },
        update: {},
        create: {
          id: `${product.id}-${restaurant.id}`,
          restaurantId: restaurant.id,
          name: product.name,
          nameFr: product.nameFr,
          category: product.category,
          unit: product.unit,
          sortOrder: product.sortOrder,
          isActive: true,
        },
      })
    }
  }
  console.log(`✅ Created ${products.length * restaurants.length} products (${products.length} per restaurant)`)

  // Create sample inventory items
  const inventoryItems = [
    {
      id: 'inv-flour-001',
      name: 'Wheat Flour',
      nameFr: 'Farine de blé',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 150,
      minStock: 50,
      reorderPoint: 75,
      unitCostGNF: 15000,
    },
    {
      id: 'inv-sugar-001',
      name: 'Sugar',
      nameFr: 'Sucre',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 80,
      minStock: 20,
      reorderPoint: 40,
      unitCostGNF: 12000,
    },
    {
      id: 'inv-butter-001',
      name: 'Butter',
      nameFr: 'Beurre',
      category: 'dairy',
      unit: 'kg',
      currentStock: 25,
      minStock: 10,
      reorderPoint: 15,
      unitCostGNF: 45000,
    },
    {
      id: 'inv-eggs-001',
      name: 'Eggs',
      nameFr: 'Oeufs',
      category: 'dairy',
      unit: 'units',
      currentStock: 120,
      minStock: 30,
      reorderPoint: 60,
      unitCostGNF: 2500,
    },
    {
      id: 'inv-yeast-001',
      name: 'Yeast',
      nameFr: 'Levure',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 5,
      minStock: 2,
      reorderPoint: 3,
      unitCostGNF: 35000,
    },
    {
      id: 'inv-salt-001',
      name: 'Salt',
      nameFr: 'Sel',
      category: 'dry_goods',
      unit: 'kg',
      currentStock: 30,
      minStock: 5,
      reorderPoint: 10,
      unitCostGNF: 3000,
    },
    {
      id: 'inv-milk-001',
      name: 'Milk',
      nameFr: 'Lait',
      category: 'dairy',
      unit: 'liters',
      currentStock: 15,
      minStock: 10,
      reorderPoint: 20,
      unitCostGNF: 8000,
    },
    {
      id: 'inv-vanilla-001',
      name: 'Vanilla Extract',
      nameFr: 'Extrait de vanille',
      category: 'flavorings',
      unit: 'ml',
      currentStock: 200,
      minStock: 50,
      reorderPoint: 100,
      unitCostGNF: 500,
    },
    {
      id: 'inv-boxes-001',
      name: 'Pastry Boxes',
      nameFr: 'Boîtes à pâtisserie',
      category: 'packaging',
      unit: 'units',
      currentStock: 200,
      minStock: 50,
      reorderPoint: 100,
      unitCostGNF: 1500,
    },
    {
      id: 'inv-bags-001',
      name: 'Paper Bags',
      nameFr: 'Sacs en papier',
      category: 'packaging',
      unit: 'units',
      currentStock: 500,
      minStock: 100,
      reorderPoint: 200,
      unitCostGNF: 500,
    },
  ]

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        ...item,
        restaurantId: restaurant.id,
      },
    })
  }
  console.log(`✅ Created ${inventoryItems.length} inventory items`)

  // Create a sample stock movement for initial inventory
  await prisma.stockMovement.upsert({
    where: { id: 'movement-initial-001' },
    update: {},
    create: {
      id: 'movement-initial-001',
      restaurantId: restaurant.id,
      itemId: 'inv-flour-001',
      type: 'Purchase',
      quantity: 150,
      unitCost: 15000,
      reason: 'Initial stock',
      createdBy: user.id,
      createdByName: user.name,
    },
  })
  console.log('✅ Created sample stock movement')

  // Create expense groups
  const expenseGroups = [
    { id: 'exp-group-ingredients', key: 'ingredients', label: 'Ingredients', labelFr: 'Ingrédients', icon: 'Package', color: '#22c55e', sortOrder: 1 },
    { id: 'exp-group-utilities', key: 'utilities', label: 'Utilities', labelFr: 'Fournitures', icon: 'Zap', color: '#3b82f6', sortOrder: 2 },
    { id: 'exp-group-salaries', key: 'salaries', label: 'Salaries', labelFr: 'Salaires', icon: 'Users', color: '#a855f7', sortOrder: 3 },
    { id: 'exp-group-maintenance', key: 'maintenance', label: 'Maintenance', labelFr: 'Entretien', icon: 'Wrench', color: '#f97316', sortOrder: 4 },
    { id: 'exp-group-rent', key: 'rent', label: 'Rent', labelFr: 'Loyer', icon: 'Building2', color: '#06b6d4', sortOrder: 5 },
    { id: 'exp-group-marketing', key: 'marketing', label: 'Marketing', labelFr: 'Marketing', icon: 'Megaphone', color: '#ec4899', sortOrder: 6 },
    { id: 'exp-group-other', key: 'other', label: 'Other', labelFr: 'Autres', icon: 'MoreHorizontal', color: '#6b7280', sortOrder: 7 },
  ]

  for (const group of expenseGroups) {
    await prisma.expenseGroup.upsert({
      where: { key: group.key },
      update: {},
      create: group,
    })
  }
  console.log(`✅ Created ${expenseGroups.length} expense groups`)

  // Create expense categories
  const categories = [
    // Ingredients
    { id: 'cat-flour', name: 'Flour', nameFr: 'Farine', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-sugar', name: 'Sugar', nameFr: 'Sucre', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-butter', name: 'Butter', nameFr: 'Beurre', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-eggs', name: 'Eggs', nameFr: 'Oeufs', color: '#22c55e', expenseGroupKey: 'ingredients' },
    { id: 'cat-other-ingredients', name: 'Other Ingredients', nameFr: 'Autres ingrédients', color: '#22c55e', expenseGroupKey: 'ingredients' },
    // Utilities
    { id: 'cat-electricity', name: 'Electricity', nameFr: 'Électricité', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-water', name: 'Water', nameFr: 'Eau', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-gas', name: 'Gas', nameFr: 'Gaz', color: '#3b82f6', expenseGroupKey: 'utilities' },
    { id: 'cat-internet', name: 'Internet', nameFr: 'Internet', color: '#3b82f6', expenseGroupKey: 'utilities' },
    // Salaries
    { id: 'cat-staff-salaries', name: 'Staff Salaries', nameFr: 'Salaires du personnel', color: '#a855f7', expenseGroupKey: 'salaries' },
    { id: 'cat-bonuses', name: 'Bonuses', nameFr: 'Primes', color: '#a855f7', expenseGroupKey: 'salaries' },
    // Maintenance
    { id: 'cat-equipment-repair', name: 'Equipment Repair', nameFr: 'Réparation équipement', color: '#f97316', expenseGroupKey: 'maintenance' },
    { id: 'cat-cleaning', name: 'Cleaning Supplies', nameFr: 'Produits de nettoyage', color: '#f97316', expenseGroupKey: 'maintenance' },
    // Rent
    { id: 'cat-monthly-rent', name: 'Monthly Rent', nameFr: 'Loyer mensuel', color: '#06b6d4', expenseGroupKey: 'rent' },
    // Marketing
    { id: 'cat-advertising', name: 'Advertising', nameFr: 'Publicité', color: '#ec4899', expenseGroupKey: 'marketing' },
    { id: 'cat-promotions', name: 'Promotions', nameFr: 'Promotions', color: '#ec4899', expenseGroupKey: 'marketing' },
    // Other
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
  console.log(`✅ Created ${categories.length} expense categories`)

  // Create suppliers
  const suppliers = [
    { id: 'sup-moulin', name: 'Moulin de Conakry', phone: '+224 622 11 11 11', email: 'contact@moulin-conakry.gn', address: 'Conakry, Centre-ville' },
    { id: 'sup-laiterie', name: 'Laiterie Nationale', phone: '+224 622 22 22 22', email: 'ventes@laiterie.gn', address: 'Conakry, Zone Industrielle' },
    { id: 'sup-emballages', name: 'Emballages Plus', phone: '+224 622 33 33 33', email: 'commandes@emballages.gn', address: 'Conakry, Matoto' },
    { id: 'sup-edg', name: 'Electricité de Guinée', phone: '+224 622 44 44 44', email: null, address: 'Conakry' },
    { id: 'sup-sotelgui', name: 'SOTELGUI', phone: '+224 622 55 55 55', email: null, address: 'Conakry' },
  ]

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { name: sup.name },
      update: {},
      create: sup,
    })
  }
  console.log(`✅ Created ${suppliers.length} suppliers`)

  // Create sample production logs with various statuses
  const productionLogs = [
    // Baguettes - Complete with stock deducted
    {
      id: 'prod-001',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      productionType: ProductCategory.Boulangerie,
      productName: 'Baguettes',
      productNameFr: 'Baguettes',
      quantity: 200,
      ingredients: ['Wheat Flour', 'Water', 'Yeast', 'Salt'],
      ingredientDetails: [
        { itemId: 'inv-flour-001', itemName: 'Wheat Flour', quantity: 40, unit: 'kg', unitCostGNF: 15000 },
        { itemId: 'inv-yeast-001', itemName: 'Yeast', quantity: 0.5, unit: 'kg', unitCostGNF: 35000 },
        { itemId: 'inv-salt-001', itemName: 'Salt', quantity: 1, unit: 'kg', unitCostGNF: 3000 },
      ],
      estimatedCostGNF: 620500,
      preparationStatus: ProductionStatus.Complete,
      status: SubmissionStatus.Approved,
      stockDeducted: true,
      stockDeductedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      createdBy: user.id,
      createdByName: user.name,
    },
    // Croissants - In Progress
    {
      id: 'prod-002',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      productionType: ProductCategory.Patisserie,
      productName: 'Croissants',
      productNameFr: 'Croissants',
      quantity: 100,
      ingredients: ['Wheat Flour', 'Butter', 'Sugar', 'Yeast', 'Milk'],
      ingredientDetails: [
        { itemId: 'inv-flour-001', itemName: 'Wheat Flour', quantity: 25, unit: 'kg', unitCostGNF: 15000 },
        { itemId: 'inv-butter-001', itemName: 'Butter', quantity: 15, unit: 'kg', unitCostGNF: 45000 },
        { itemId: 'inv-sugar-001', itemName: 'Sugar', quantity: 5, unit: 'kg', unitCostGNF: 12000 },
        { itemId: 'inv-yeast-001', itemName: 'Yeast', quantity: 0.3, unit: 'kg', unitCostGNF: 35000 },
        { itemId: 'inv-milk-001', itemName: 'Milk', quantity: 3, unit: 'liters', unitCostGNF: 8000 },
      ],
      estimatedCostGNF: 1119500,
      preparationStatus: ProductionStatus.InProgress,
      status: SubmissionStatus.Pending,
      stockDeducted: true,
      stockDeductedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdBy: user.id,
      createdByName: user.name,
    },
    // Pain au Chocolat - Ready
    {
      id: 'prod-003',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      productionType: ProductCategory.Patisserie,
      productName: 'Pain au Chocolat',
      productNameFr: 'Pain au Chocolat',
      quantity: 80,
      ingredients: ['Wheat Flour', 'Butter', 'Sugar', 'Eggs'],
      ingredientDetails: [
        { itemId: 'inv-flour-001', itemName: 'Wheat Flour', quantity: 20, unit: 'kg', unitCostGNF: 15000 },
        { itemId: 'inv-butter-001', itemName: 'Butter', quantity: 10, unit: 'kg', unitCostGNF: 45000 },
        { itemId: 'inv-sugar-001', itemName: 'Sugar', quantity: 8, unit: 'kg', unitCostGNF: 12000 },
        { itemId: 'inv-eggs-001', itemName: 'Eggs', quantity: 50, unit: 'units', unitCostGNF: 2500 },
      ],
      estimatedCostGNF: 871000,
      preparationStatus: ProductionStatus.Ready,
      status: SubmissionStatus.Pending,
      stockDeducted: false,
      createdBy: user.id,
      createdByName: user.name,
    },
    // Baguettes - Today Planning (deferred mode test)
    {
      id: 'prod-004',
      restaurantId: restaurant.id,
      date: new Date(),
      productionType: ProductCategory.Boulangerie,
      productName: 'Baguettes',
      productNameFr: 'Baguettes',
      quantity: 150,
      ingredients: ['Wheat Flour', 'Yeast', 'Salt'],
      ingredientDetails: [
        { itemId: 'inv-flour-001', itemName: 'Wheat Flour', quantity: 30, unit: 'kg', unitCostGNF: 15000 },
        { itemId: 'inv-yeast-001', itemName: 'Yeast', quantity: 0.4, unit: 'kg', unitCostGNF: 35000 },
        { itemId: 'inv-salt-001', itemName: 'Salt', quantity: 0.8, unit: 'kg', unitCostGNF: 3000 },
      ],
      estimatedCostGNF: 466400,
      preparationStatus: ProductionStatus.Planning,
      status: SubmissionStatus.Pending,
      stockDeducted: false,
      createdBy: user.id,
      createdByName: user.name,
    },
  ]

  for (const log of productionLogs) {
    await prisma.productionLog.upsert({
      where: { id: log.id },
      update: {},
      create: log,
    })
  }
  console.log(`✅ Created ${productionLogs.length} production logs`)

  // Create ProductionItem records to link production logs with products
  const productionItems = [
    // prod-001: Baguettes (200 baguettes)
    {
      id: 'prod-item-001',
      productionLogId: 'prod-001',
      productId: `prod-baguette-${restaurant.id}`,
      quantity: 200,
    },
    // prod-002: Croissants (100 croissants)
    {
      id: 'prod-item-002',
      productionLogId: 'prod-002',
      productId: `prod-croissant-${restaurant.id}`,
      quantity: 100,
    },
    // prod-003: Pain au Chocolat (80 pieces)
    {
      id: 'prod-item-003',
      productionLogId: 'prod-003',
      productId: `prod-pain-chocolat-${restaurant.id}`,
      quantity: 80,
    },
    // prod-004: Baguettes (150 baguettes)
    {
      id: 'prod-item-004',
      productionLogId: 'prod-004',
      productId: `prod-baguette-${restaurant.id}`,
      quantity: 150,
    },
  ]

  for (const item of productionItems) {
    await prisma.productionItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    })
  }
  console.log(`✅ Created ${productionItems.length} production items`)

  // Create stock movements for production
  const productionMovements = [
    // Baguettes production movements (prod-001)
    {
      id: 'movement-prod-001-flour',
      restaurantId: restaurant.id,
      itemId: 'inv-flour-001',
      type: 'Usage',
      quantity: -40,
      unitCost: 15000,
      reason: 'Production: Baguettes (qty: 200)',
      productionLogId: 'prod-001',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'movement-prod-001-yeast',
      restaurantId: restaurant.id,
      itemId: 'inv-yeast-001',
      type: 'Usage',
      quantity: -0.5,
      unitCost: 35000,
      reason: 'Production: Baguettes (qty: 200)',
      productionLogId: 'prod-001',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'movement-prod-001-salt',
      restaurantId: restaurant.id,
      itemId: 'inv-salt-001',
      type: 'Usage',
      quantity: -1,
      unitCost: 3000,
      reason: 'Production: Baguettes (qty: 200)',
      productionLogId: 'prod-001',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    // Croissants production movements (prod-002)
    {
      id: 'movement-prod-002-flour',
      restaurantId: restaurant.id,
      itemId: 'inv-flour-001',
      type: 'Usage',
      quantity: -25,
      unitCost: 15000,
      reason: 'Production: Croissants (qty: 100)',
      productionLogId: 'prod-002',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'movement-prod-002-butter',
      restaurantId: restaurant.id,
      itemId: 'inv-butter-001',
      type: 'Usage',
      quantity: -15,
      unitCost: 45000,
      reason: 'Production: Croissants (qty: 100)',
      productionLogId: 'prod-002',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    // Purchase movements
    {
      id: 'movement-purchase-sugar',
      restaurantId: restaurant.id,
      itemId: 'inv-sugar-001',
      type: 'Purchase',
      quantity: 50,
      unitCost: 12000,
      reason: 'Weekly restock',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'movement-purchase-butter',
      restaurantId: restaurant.id,
      itemId: 'inv-butter-001',
      type: 'Purchase',
      quantity: 20,
      unitCost: 45000,
      reason: 'Weekly restock',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    // Waste movement
    {
      id: 'movement-waste-eggs',
      restaurantId: restaurant.id,
      itemId: 'inv-eggs-001',
      type: 'Waste',
      quantity: -10,
      unitCost: 2500,
      reason: 'Expired eggs',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    // Adjustment
    {
      id: 'movement-adjust-milk',
      restaurantId: restaurant.id,
      itemId: 'inv-milk-001',
      type: 'Adjustment',
      quantity: 5,
      unitCost: 8000,
      reason: 'Inventory count correction',
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const movement of productionMovements) {
    await prisma.stockMovement.upsert({
      where: { id: movement.id },
      update: {},
      create: movement as any,
    })
  }
  console.log(`✅ Created ${productionMovements.length} additional stock movements`)

  // Update inventory stock levels to reflect movements
  await prisma.inventoryItem.update({
    where: { id: 'inv-flour-001' },
    data: { currentStock: 85 }, // 150 - 40 - 25
  })
  await prisma.inventoryItem.update({
    where: { id: 'inv-yeast-001' },
    data: { currentStock: 4.5 }, // 5 - 0.5
  })
  await prisma.inventoryItem.update({
    where: { id: 'inv-salt-001' },
    data: { currentStock: 29 }, // 30 - 1
  })
  await prisma.inventoryItem.update({
    where: { id: 'inv-butter-001' },
    data: { currentStock: 10 }, // 25 + 20 - 15 = 30, then set to 10 (below min)
  })
  await prisma.inventoryItem.update({
    where: { id: 'inv-sugar-001' },
    data: { currentStock: 130 }, // 80 + 50
  })
  await prisma.inventoryItem.update({
    where: { id: 'inv-eggs-001' },
    data: { currentStock: 110 }, // 120 - 10
  })
  await prisma.inventoryItem.update({
    where: { id: 'inv-milk-001' },
    data: { currentStock: 20 }, // 15 + 5
  })
  console.log('✅ Updated inventory stock levels')

  // Create sample sales
  const sales = [
    {
      id: 'sale-001',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      totalGNF: 2500000,
      cashGNF: 1500000,
      orangeMoneyGNF: 800000,
      cardGNF: 200000,
      itemsCount: 450,
      customersCount: 120,
      status: SubmissionStatus.Approved,
      submittedBy: user.id,
      submittedByName: user.name,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'sale-002',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      totalGNF: 2800000,
      cashGNF: 1800000,
      orangeMoneyGNF: 900000,
      cardGNF: 100000,
      itemsCount: 520,
      customersCount: 145,
      status: SubmissionStatus.Approved,
      submittedBy: user.id,
      submittedByName: user.name,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'sale-003',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      totalGNF: 2200000,
      cashGNF: 1400000,
      orangeMoneyGNF: 700000,
      cardGNF: 100000,
      itemsCount: 400,
      customersCount: 110,
      status: SubmissionStatus.Approved,
      submittedBy: user.id,
      submittedByName: user.name,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'sale-004',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      totalGNF: 3100000,
      cashGNF: 2000000,
      orangeMoneyGNF: 1000000,
      cardGNF: 100000,
      itemsCount: 580,
      customersCount: 165,
      status: SubmissionStatus.Pending,
      submittedBy: user.id,
      submittedByName: user.name,
    },
    {
      id: 'sale-005',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      totalGNF: 2900000,
      cashGNF: 1700000,
      orangeMoneyGNF: 1100000,
      cardGNF: 100000,
      itemsCount: 510,
      customersCount: 150,
      status: SubmissionStatus.Pending,
      submittedBy: user.id,
      submittedByName: user.name,
    },
  ]

  for (const sale of sales) {
    await prisma.sale.upsert({
      where: { id: sale.id },
      update: {},
      create: sale,
    })
  }
  console.log(`✅ Created ${sales.length} sales records`)

  // Create sample expenses
  const flourCat = await prisma.category.findUnique({ where: { name: 'Flour' } })
  const butterCat = await prisma.category.findUnique({ where: { name: 'Butter' } })
  const electricityCat = await prisma.category.findUnique({ where: { name: 'Electricity' } })
  const salariesCat = await prisma.category.findUnique({ where: { name: 'Staff Salaries' } })

  const expenses = [
    // Inventory purchase - Flour (with ExpenseItems)
    {
      id: 'exp-001',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      categoryId: flourCat?.id,
      categoryName: 'Flour',
      amountGNF: 2250000, // 150 kg * 15000
      paymentMethod: 'Cash',
      description: 'Weekly flour purchase',
      isInventoryPurchase: true,
      status: SubmissionStatus.Approved,
      submittedBy: user.id,
      submittedByName: user.name,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      supplierId: 'sup-moulin',
    },
    // Inventory purchase - Butter & Sugar (with ExpenseItems)
    {
      id: 'exp-002',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      categoryId: butterCat?.id,
      categoryName: 'Butter',
      amountGNF: 1500000, // 20kg butter * 45000 + 50kg sugar * 12000
      paymentMethod: 'Orange Money',
      description: 'Weekly butter and sugar restock',
      isInventoryPurchase: true,
      status: SubmissionStatus.Approved,
      submittedBy: user.id,
      submittedByName: user.name,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      supplierId: 'sup-laiterie',
    },
    // Electricity bill
    {
      id: 'exp-003',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      categoryId: electricityCat?.id,
      categoryName: 'Electricity',
      amountGNF: 850000,
      paymentMethod: 'Cash',
      description: 'Monthly electricity bill',
      isInventoryPurchase: false,
      status: SubmissionStatus.Approved,
      submittedBy: user.id,
      submittedByName: user.name,
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      supplierId: 'sup-edg',
    },
    // Staff salaries
    {
      id: 'exp-004',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      categoryId: salariesCat?.id,
      categoryName: 'Staff Salaries',
      amountGNF: 5000000,
      paymentMethod: 'Orange Money',
      description: 'Monthly staff salaries',
      isInventoryPurchase: false,
      status: SubmissionStatus.Pending,
      submittedBy: user.id,
      submittedByName: user.name,
    },
  ]

  for (const expense of expenses) {
    await prisma.expense.upsert({
      where: { id: expense.id },
      update: {},
      create: expense,
    })
  }
  console.log(`✅ Created ${expenses.length} expense records`)

  // Create ExpenseItems for inventory purchases
  const expenseItems = [
    // exp-001 - Flour purchase
    {
      id: 'exp-item-001',
      expenseId: 'exp-001',
      inventoryItemId: 'inv-flour-001',
      quantity: 150,
      unitCostGNF: 15000,
    },
    // exp-002 - Butter and sugar
    {
      id: 'exp-item-002',
      expenseId: 'exp-002',
      inventoryItemId: 'inv-butter-001',
      quantity: 20,
      unitCostGNF: 45000,
    },
    {
      id: 'exp-item-003',
      expenseId: 'exp-002',
      inventoryItemId: 'inv-sugar-001',
      quantity: 50,
      unitCostGNF: 12000,
    },
  ]

  for (const item of expenseItems) {
    await prisma.expenseItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    })
  }
  console.log(`✅ Created ${expenseItems.length} expense items`)

  // Create sample customers
  const customers = [
    {
      id: 'cust-001',
      restaurantId: restaurant.id,
      name: 'Hotel Noom',
      phone: '+224 620 99 99 99',
      email: 'manager@hotelnoom.gn',
      company: 'Hotel Noom',
      customerType: 'Corporate',
      creditLimit: 5000000,
      isActive: true,
    },
    {
      id: 'cust-002',
      restaurantId: restaurant.id,
      name: 'Restaurant Le Damier',
      phone: '+224 620 88 88 88',
      company: 'Le Damier',
      customerType: 'Wholesale',
      creditLimit: 3000000,
      isActive: true,
    },
    {
      id: 'cust-003',
      restaurantId: restaurant.id,
      name: 'Mariama Diallo',
      phone: '+224 620 77 77 77',
      customerType: 'Individual',
      creditLimit: 500000,
      isActive: true,
    },
  ]

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {},
      create: customer as any,
    })
  }
  console.log(`✅ Created ${customers.length} customers`)

  // Create sample debts
  const debts = [
    {
      id: 'debt-001',
      restaurantId: restaurant.id,
      customerId: 'cust-001',
      saleId: 'sale-004', // Link to pending sale
      principalAmount: 1500000,
      paidAmount: 500000,
      remainingAmount: 1000000,
      status: 'PartiallyPaid',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      description: 'Daily bread delivery for Hotel Noom',
      createdBy: user.id,
      createdByName: user.name,
    },
    {
      id: 'debt-002',
      restaurantId: restaurant.id,
      customerId: 'cust-002',
      principalAmount: 800000,
      paidAmount: 800000,
      remainingAmount: 0,
      status: 'FullyPaid',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      description: 'Pastries for event',
      createdBy: user.id,
      createdByName: user.name,
    },
    {
      id: 'debt-003',
      restaurantId: restaurant.id,
      customerId: 'cust-003',
      principalAmount: 150000,
      paidAmount: 0,
      remainingAmount: 150000,
      status: 'Outstanding',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      description: 'Wedding cake deposit',
      createdBy: user.id,
      createdByName: user.name,
    },
    {
      id: 'debt-004',
      restaurantId: restaurant.id,
      customerId: 'cust-001',
      principalAmount: 600000,
      paidAmount: 0,
      remainingAmount: 600000,
      status: 'Overdue',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days overdue
      description: 'Catering order',
      createdBy: user.id,
      createdByName: user.name,
    },
  ]

  for (const debt of debts) {
    await prisma.debt.upsert({
      where: { id: debt.id },
      update: {},
      create: debt as any,
    })
  }
  console.log(`✅ Created ${debts.length} debts`)

  // Create debt payments
  const debtPayments = [
    {
      id: 'debt-pay-001',
      restaurantId: restaurant.id,
      debtId: 'debt-001',
      customerId: 'cust-001',
      amount: 500000,
      paymentMethod: 'Orange Money',
      paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      receiptNumber: 'REC-2026-001',
      notes: 'Partial payment',
      receivedBy: user.id,
      receivedByName: user.name,
    },
    {
      id: 'debt-pay-002',
      restaurantId: restaurant.id,
      debtId: 'debt-002',
      customerId: 'cust-002',
      amount: 800000,
      paymentMethod: 'Cash',
      paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      receiptNumber: 'REC-2026-002',
      notes: 'Full payment',
      receivedBy: user.id,
      receivedByName: user.name,
    },
  ]

  for (const payment of debtPayments) {
    await prisma.debtPayment.upsert({
      where: { id: payment.id },
      update: {},
      create: payment,
    })
  }
  console.log(`✅ Created ${debtPayments.length} debt payments`)

  // Create bank transactions
  const bankTransactions = [
    // Sales deposits
    {
      id: 'bank-001',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      amount: 1500000,
      type: 'Deposit',
      method: 'Cash',
      reason: 'SalesDeposit',
      saleId: 'sale-001',
      description: 'Daily sales deposit',
      status: 'Confirmed',
      confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      bankRef: 'DEP-2026-001',
      createdBy: user.id,
      createdByName: user.name,
    },
    {
      id: 'bank-002',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      amount: 1800000,
      type: 'Deposit',
      method: 'Cash',
      reason: 'SalesDeposit',
      saleId: 'sale-002',
      description: 'Daily sales deposit',
      status: 'Confirmed',
      confirmedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      bankRef: 'DEP-2026-002',
      createdBy: user.id,
      createdByName: user.name,
    },
    // Debt collection
    {
      id: 'bank-003',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      amount: 800000,
      type: 'Deposit',
      method: 'Cash',
      reason: 'DebtCollection',
      debtPaymentId: 'debt-pay-002',
      description: 'Customer debt payment from Le Damier',
      status: 'Confirmed',
      confirmedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      bankRef: 'DEP-2026-003',
      createdBy: user.id,
      createdByName: user.name,
    },
    // Expense payment (withdrawal)
    {
      id: 'bank-004',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      amount: 2250000,
      type: 'Withdrawal',
      method: 'Cash',
      reason: 'ExpensePayment',
      description: 'Flour purchase from Moulin de Conakry',
      status: 'Confirmed',
      confirmedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      bankRef: 'WTH-2026-001',
      createdBy: user.id,
      createdByName: user.name,
    },
    // Owner withdrawal
    {
      id: 'bank-005',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      amount: 3000000,
      type: 'Withdrawal',
      method: 'Cash',
      reason: 'OwnerWithdrawal',
      description: 'Owner personal withdrawal',
      status: 'Confirmed',
      confirmedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      bankRef: 'WTH-2026-002',
      createdBy: user.id,
      createdByName: user.name,
    },
    // Capital injection
    {
      id: 'bank-006',
      restaurantId: restaurant.id,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      amount: 10000000,
      type: 'Deposit',
      method: 'Cash',
      reason: 'CapitalInjection',
      description: 'Owner capital injection',
      status: 'Confirmed',
      confirmedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      bankRef: 'DEP-2026-004',
      createdBy: user.id,
      createdByName: user.name,
    },
    // Pending transaction
    {
      id: 'bank-007',
      restaurantId: restaurant.id,
      date: new Date(),
      amount: 1400000,
      type: 'Deposit',
      method: 'Cash',
      reason: 'SalesDeposit',
      saleId: 'sale-003',
      description: 'Daily sales deposit - pending confirmation',
      status: 'Pending',
      createdBy: user.id,
      createdByName: user.name,
    },
  ]

  for (const transaction of bankTransactions) {
    await prisma.bankTransaction.upsert({
      where: { id: transaction.id },
      update: {},
      create: transaction as any,
    })
  }
  console.log(`✅ Created ${bankTransactions.length} bank transactions`)

  // Link expense payment to bank transaction
  await prisma.expensePayment.create({
    data: {
      expenseId: 'exp-001',
      amount: 2250000,
      paymentMethod: 'Cash',
      bankTransactionId: 'bank-004',
      paidBy: user.id,
      paidByName: user.name,
    },
  })
  console.log('✅ Created expense payment record')

  // Update expense payment status
  await prisma.expense.update({
    where: { id: 'exp-001' },
    data: {
      paymentStatus: 'Paid',
      totalPaidAmount: 2250000,
      fullyPaidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  })
  console.log('✅ Updated expense payment status')

  console.log('')
  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📋 Summary:')
  console.log(`   - Restaurants:`)
  console.log(`     • ${restaurant1.name} (${restaurant1.location})`)
  console.log(`     • ${restaurant2.name} (${restaurant2.location})`)
  console.log(`     • ${restaurant3.name} (${restaurant3.location})`)
  console.log(`   - User: ${user.email} (${user.role})`)
  console.log(`   - Payment Methods: 9 (3 per restaurant)`)
  console.log(`   - Products: ${products.length * restaurants.length} (${products.length} per restaurant)`)
  console.log(`   - Customers: 3`)
  console.log(`   - Debts: 4 (Outstanding, PartiallyPaid, FullyPaid, Overdue)`)
  console.log(`   - Debt Payments: 2`)
  console.log(`   - Bank Transactions: 7 (Deposits, Withdrawals, Pending)`)
  console.log(`   - Inventory Items: ${inventoryItems.length}`)
  console.log(`   - Production Logs: ${productionLogs.length}`)
  console.log(`   - Production Items: ${productionItems.length}`)
  console.log(`   - Stock Movements: ${productionMovements.length + 1}`)
  console.log(`   - Sales Records: ${sales.length}`)
  console.log(`   - Expenses: ${expenses.length}`)
  console.log(`   - Expense Items: ${expenseItems.length}`)
  console.log('')
  console.log('🚀 You can now login and access the app!')
  console.log('💡 Test bakery switching by clicking the logo!')
  console.log('📊 Dashboard has real data: sales, inventory, debts, bank transactions!')
  console.log('🥐 Check Baking > Production to log Patisserie/Boulangerie products')
  console.log('💰 Check Finances > Debts to see customer accounts')
  console.log('🏦 Check Finances > Bank to see deposit/withdrawal history')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
