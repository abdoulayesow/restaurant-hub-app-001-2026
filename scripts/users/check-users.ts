/**
 * Check user configuration in database
 * Usage (local): npx tsx scripts/check-users.ts
 * Usage (prod): DATABASE_URL="..." npx tsx scripts/check-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const emails = ['abdoulaye.sow.co@gmail.com', 'abdoulaye.sow@friasoft']

  console.log('Checking users in database...\n')

  for (const email of emails) {
    console.log(`\n=== User: ${email} ===`)

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        restaurants: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                location: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User NOT FOUND in database')
      continue
    }

    console.log('✅ User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name || 'N/A'}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`)
    console.log(`   Created: ${user.createdAt}`)

    if (user.restaurants.length === 0) {
      console.log('\n⚠️  User has NO restaurant assignments')
    } else {
      console.log(`\n📍 Restaurant Assignments (${user.restaurants.length}):`)
      user.restaurants.forEach((ur, idx) => {
        console.log(`\n   ${idx + 1}. ${ur.restaurant.name}`)
        console.log(`      Location: ${ur.restaurant.location || 'N/A'}`)
        console.log(`      Role: ${ur.role}`)
        console.log(`      Assigned: ${ur.createdAt}`)
      })
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
