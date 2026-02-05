/**
 * Cleanup script to remove old bakery-* restaurants
 * These are duplicates from an older naming convention
 * Users are already linked to the new bliss-* restaurants
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const OLD_RESTAURANT_IDS = ['bakery-conakry-main', 'bakery-ratoma', 'bakery-kaloum'];

async function cleanupOldRestaurants() {
  console.log('='.repeat(60));
  console.log('Cleanup: Removing old bakery-* restaurants');
  console.log('='.repeat(60));
  console.log('');

  for (const restaurantId of OLD_RESTAURANT_IDS) {
    console.log(`Processing: ${restaurantId}`);

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      console.log(`  Restaurant not found, skipping...`);
      continue;
    }

    // Delete in FK order (child tables first)
    const bankTxCount = await prisma.bankTransaction.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${bankTxCount.count} bank transactions`);

    const debtPaymentCount = await prisma.debtPayment.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${debtPaymentCount.count} debt payments`);

    const debtCount = await prisma.debt.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${debtCount.count} debts`);

    const saleItemCount = await prisma.saleItem.deleteMany({ where: { sale: { restaurantId } } });
    console.log(`  Deleted ${saleItemCount.count} sale items`);

    const saleCount = await prisma.sale.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${saleCount.count} sales`);

    const expPaymentCount = await prisma.expensePayment.deleteMany({ where: { expense: { restaurantId } } });
    console.log(`  Deleted ${expPaymentCount.count} expense payments`);

    const expItemCount = await prisma.expenseItem.deleteMany({ where: { expense: { restaurantId } } });
    console.log(`  Deleted ${expItemCount.count} expense items`);

    const stockMovCount = await prisma.stockMovement.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${stockMovCount.count} stock movements`);

    const expenseCount = await prisma.expense.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${expenseCount.count} expenses`);

    const prodItemCount = await prisma.productionItem.deleteMany({ where: { productionLog: { restaurantId } } });
    console.log(`  Deleted ${prodItemCount.count} production items`);

    const prodLogCount = await prisma.productionLog.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${prodLogCount.count} production logs`);

    const customerCount = await prisma.customer.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${customerCount.count} customers`);

    const summaryCount = await prisma.dailySummary.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${summaryCount.count} daily summaries`);

    const productCount = await prisma.product.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${productCount.count} products`);

    // Delete inventory transfers that reference this restaurant's inventory items
    const inventoryIds = await prisma.inventoryItem.findMany({
      where: { restaurantId },
      select: { id: true }
    });
    const invIdList = inventoryIds.map(i => i.id);

    if (invIdList.length > 0) {
      const transferCount = await prisma.inventoryTransfer.deleteMany({
        where: {
          OR: [
            { sourceItemId: { in: invIdList } },
            { targetItemId: { in: invIdList } }
          ]
        }
      });
      console.log(`  Deleted ${transferCount.count} inventory transfers`);
    }

    const inventoryCount = await prisma.inventoryItem.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${inventoryCount.count} inventory items`);

    // Delete user-restaurant associations for this old restaurant
    const userRestCount = await prisma.userRestaurant.deleteMany({ where: { restaurantId } });
    console.log(`  Deleted ${userRestCount.count} user-restaurant associations`);

    // Update users who have this as default to use bliss-miniere instead
    const userUpdateCount = await prisma.user.updateMany({
      where: { defaultRestaurantId: restaurantId },
      data: { defaultRestaurantId: 'bliss-miniere' }
    });
    if (userUpdateCount.count > 0) {
      console.log(`  Updated ${userUpdateCount.count} users default to bliss-miniere`);
    }

    // Finally delete the restaurant
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    console.log(`  ✓ Deleted restaurant: ${restaurant.name}`);
    console.log('');
  }

  // Verify remaining restaurants
  const remaining = await prisma.restaurant.findMany({
    select: { id: true, name: true, isActive: true }
  });
  console.log('='.repeat(60));
  console.log('Remaining restaurants:');
  remaining.forEach(r => console.log(`  ${r.id} - ${r.name} (active: ${r.isActive})`));
  console.log('='.repeat(60));
}

cleanupOldRestaurants()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
