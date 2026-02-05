/**
 * Script to set up test users with RBAC roles for testing
 *
 * This script:
 * 1. Updates existing users' roles (if they've already logged in via OAuth)
 * 2. Creates UserRestaurant assignments with appropriate roles
 * 3. Does NOT create new users (they must login via Google OAuth first)
 *
 * Usage:
 *   npx tsx scripts/setup-test-users.ts
 *
 * Test Users:
 *   - abdoulaye.sow.1989@gmail.com → Owner (both restaurants)
 *   - abdoulaye.sow.co@gmail.com → RestaurantManager (Bliss Minière)
 *   - abdoulaye.sow@friasoft.com → RestaurantManager (Bliss Tahouyah)
 */

import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

interface TestUserConfig {
  email: string
  name: string
  globalRole: UserRole
  restaurantAssignments: {
    restaurantName: string
    role: UserRole
  }[]
  defaultRestaurantName: string
}

const TEST_USERS: TestUserConfig[] = [
  {
    email: 'abdoulaye.sow.1989@gmail.com',
    name: 'Abdoulaye Sow',
    globalRole: UserRole.Owner,
    restaurantAssignments: [
      { restaurantName: 'Bliss Minière', role: UserRole.Owner },
      { restaurantName: 'Bliss Tahouyah', role: UserRole.Owner },
    ],
    defaultRestaurantName: 'Bliss Minière',
  },
  {
    email: 'abdoulaye.sow.co@gmail.com',
    name: 'Abdoulaye Sow (Manager Minière)',
    globalRole: UserRole.RestaurantManager,
    restaurantAssignments: [
      { restaurantName: 'Bliss Minière', role: UserRole.RestaurantManager },
    ],
    defaultRestaurantName: 'Bliss Minière',
  },
  {
    email: 'abdoulaye.sow@friasoft.com',
    name: 'Abdoulaye Sow (Manager Tahouyah)',
    globalRole: UserRole.RestaurantManager,
    restaurantAssignments: [
      { restaurantName: 'Bliss Tahouyah', role: UserRole.RestaurantManager },
    ],
    defaultRestaurantName: 'Bliss Tahouyah',
  },
]

async function main() {
  console.log('='.repeat(60))
  console.log('RBAC Test User Setup')
  console.log('='.repeat(60))
  console.log('')

  // Fetch all restaurants
  const restaurants = await prisma.restaurant.findMany()
  if (restaurants.length === 0) {
    console.error('ERROR: No restaurants found. Run prisma db seed first.')
    process.exit(1)
  }

  console.log(`Found ${restaurants.length} restaurants:`)
  restaurants.forEach(r => console.log(`  - ${r.name}`))
  console.log('')

  // Create restaurant lookup map
  const restaurantMap = new Map(restaurants.map(r => [r.name, r]))

  // Process each test user
  for (const config of TEST_USERS) {
    console.log(`Processing: ${config.email}`)

    // Find user (must have logged in via OAuth first)
    const user = await prisma.user.findUnique({
      where: { email: config.email },
    })

    if (!user) {
      console.log(`  ⚠️  User not found. They must login via Google OAuth first.`)
      console.log(`     Add to ALLOWED_EMAILS in .env, then have them login.`)
      continue
    }

    // Get default restaurant
    const defaultRestaurant = restaurantMap.get(config.defaultRestaurantName)
    if (!defaultRestaurant) {
      console.log(`  ⚠️  Default restaurant "${config.defaultRestaurantName}" not found. Skipping.`)
      continue
    }

    // Update user's global role and default restaurant
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: config.globalRole,
        defaultRestaurantId: defaultRestaurant.id,
      },
    })
    console.log(`  ✓ Updated global role: ${config.globalRole}`)

    // Process restaurant assignments
    for (const assignment of config.restaurantAssignments) {
      const restaurant = restaurantMap.get(assignment.restaurantName)
      if (!restaurant) {
        console.log(`  ⚠️  Restaurant "${assignment.restaurantName}" not found. Skipping assignment.`)
        continue
      }

      await prisma.userRestaurant.upsert({
        where: {
          userId_restaurantId: {
            userId: user.id,
            restaurantId: restaurant.id,
          },
        },
        update: { role: assignment.role },
        create: {
          userId: user.id,
          restaurantId: restaurant.id,
          role: assignment.role,
        },
      })
      console.log(`  ✓ Assigned to ${assignment.restaurantName} as ${assignment.role}`)
    }

    console.log('')
  }

  // Summary
  console.log('='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))

  const allUserRestaurants = await prisma.userRestaurant.findMany({
    include: {
      user: { select: { email: true, role: true } },
      restaurant: { select: { name: true } },
    },
  })

  console.log('\nCurrent User-Restaurant Assignments:')
  console.log('-'.repeat(80))
  console.log(
    'Email'.padEnd(35) +
    'Restaurant'.padEnd(20) +
    'Per-Restaurant Role'.padEnd(25)
  )
  console.log('-'.repeat(80))

  for (const ur of allUserRestaurants) {
    console.log(
      ur.user.email.padEnd(35) +
      ur.restaurant.name.padEnd(20) +
      ur.role.padEnd(25)
    )
  }

  console.log('')
  console.log('Done!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
