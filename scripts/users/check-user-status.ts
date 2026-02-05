import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserStatus() {
  const emails = [
    'abdoulaye.sow.co@gmail.com',
    'abdoulaye.sow@friasoft.com'
  ]

  console.log('Checking user status in database...\n')

  for (const email of emails) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Email: ${email}`)
    console.log('='.repeat(60))

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        restaurants: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                location: true,
                isActive: true
              }
            }
          },
          select: {
            role: true,
            createdAt: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                location: true,
                isActive: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User NOT found in database')
      console.log('   → This user needs to be created/invited')
    } else {
      console.log('✅ User found in database')
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name || '(not set)'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Created: ${user.createdAt}`)

      if (user.restaurants.length === 0) {
        console.log('\n⚠️  User has NO restaurant assignments')
        console.log('   → User exists but is not assigned to any restaurant')
      } else {
        console.log(`\n✅ Assigned to ${user.restaurants.length} restaurant(s):`)
        for (const assignment of user.restaurants) {
          console.log(`   - ${assignment.restaurant.name}`)
          console.log(`     Role: ${assignment.role}`)
          console.log(`     Active: ${assignment.restaurant.isActive ? 'Yes' : 'No'}`)
          console.log(`     Location: ${assignment.restaurant.location || '(not set)'}`)
          console.log(`     Assigned: ${assignment.createdAt}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Check complete!')
  console.log('='.repeat(60) + '\n')
}

checkUserStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
