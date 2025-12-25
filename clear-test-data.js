import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAIL = 'test@email.com';

async function clearData() {
  console.log('Clearing test data...\n');

  try {
    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { email: EMAIL },
    });

    if (!user) {
      console.log('User not found');
      await prisma.$disconnect();
      return;
    }

    // 2. Delete all transactions
    console.log('Deleting transactions...');
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: { userId: user.id },
    });
    console.log(`✓ Deleted ${deletedTransactions.count} transactions\n`);

    // 3. Delete all categories
    console.log('Deleting categories...');
    const deletedCategories = await prisma.category.deleteMany({
      where: { userId: user.id },
    });
    console.log(`✓ Deleted ${deletedCategories.count} categories\n`);

    // 4. Reset account balances to 0
    console.log('Resetting account balances...');
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
    });

    for (const account of accounts) {
      await prisma.account.update({
        where: { id: account.id },
        data: { currentBalance: 0 },
      });
    }
    console.log(`✓ Reset ${accounts.length} account balances\n`);

    console.log('✅ All test data cleared!');
    console.log(`Accounts remaining: ${accounts.length}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
