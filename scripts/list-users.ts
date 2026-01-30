import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true }
  })

  console.log('Users in database:')
  if (users.length === 0) {
    console.log('  (none)')
  } else {
    for (const u of users) {
      console.log(`  - ${u.email} | ${u.role}`)
    }
  }
}

main()
  .finally(() => prisma.$disconnect())
