import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create bakeries
  const bakery1 = await prisma.bakery.upsert({
    where: { id: 'bakery-conakry-main' },
    update: {},
    create: {
      id: 'bakery-conakry-main',
      name: 'Boulangerie Centrale',
      location: 'Conakry - Centre',
      currency: 'GNF',
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
  console.log('✅ Created bakery:', bakery1.name)

  const bakery2 = await prisma.bakery.upsert({
    where: { id: 'bakery-kaloum' },
    update: {},
    create: {
      id: 'bakery-kaloum',
      name: 'Boulangerie Kaloum',
      location: 'Conakry - Kaloum',
      currency: 'GNF',
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
  console.log('✅ Created bakery:', bakery2.name)

  const bakery3 = await prisma.bakery.upsert({
    where: { id: 'bakery-ratoma' },
    update: {},
    create: {
      id: 'bakery-ratoma',
      name: 'Boulangerie Ratoma',
      location: 'Conakry - Ratoma',
      currency: 'GNF',
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
  console.log('✅ Created bakery:', bakery3.name)

  // Use first bakery as the main one for inventory
  const bakery = bakery1

  // Find or create the user (will be created by NextAuth on first login)
  // This ensures the user exists and is assigned to the bakery
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
  await prisma.userBakery.upsert({
    where: {
      userId_bakeryId: {
        userId: user.id,
        bakeryId: bakery1.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      bakeryId: bakery1.id,
    },
  })

  await prisma.userBakery.upsert({
    where: {
      userId_bakeryId: {
        userId: user.id,
        bakeryId: bakery2.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      bakeryId: bakery2.id,
    },
  })

  await prisma.userBakery.upsert({
    where: {
      userId_bakeryId: {
        userId: user.id,
        bakeryId: bakery3.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      bakeryId: bakery3.id,
    },
  })
  console.log('✅ Assigned user to 3 bakeries')

  // Set default bakery for user
  await prisma.user.update({
    where: { id: user.id },
    data: { defaultBakeryId: bakery.id },
  })
  console.log('✅ Set default bakery for user')

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
        bakeryId: bakery.id,
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
      bakeryId: bakery.id,
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

  console.log('')
  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📋 Summary:')
  console.log(`   - Bakeries:`)
  console.log(`     • ${bakery1.name} (${bakery1.location})`)
  console.log(`     • ${bakery2.name} (${bakery2.location})`)
  console.log(`     • ${bakery3.name} (${bakery3.location})`)
  console.log(`   - User: ${user.email} (${user.role})`)
  console.log(`   - Inventory Items: ${inventoryItems.length}`)
  console.log('')
  console.log('🚀 You can now login and access the app!')
  console.log('💡 Test bakery switching by clicking the logo!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
