const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSalesDates() {
  const sales = await prisma.sale.findMany({
    where: {
      restaurantId: 'bakery-conakry-main',
      status: 'Approved'
    },
    select: { date: true, totalGNF: true },
    orderBy: { date: 'desc' }
  })

  console.log('Approved sales with dates:')
  sales.forEach(s => {
    const dateStr = s.date.toISOString().split('T')[0]
    console.log(`  ${dateStr}: ${s.totalGNF.toLocaleString()} GNF`)
  })

  await prisma.$disconnect()
}

checkSalesDates()
