import { prisma } from '@/lib/prisma';
import { calculateCategoryBudgetStatus } from '@/lib/balanceCalculations';
import { Category, CategoryRolloverUpdate, RolloverSummary, Transaction } from '@/types';

/**
 * Process monthly rollover for a user
 * Updates each category's rolloverBalance with unspent budget from previous month
 */
export async function processMonthlyRollover(userId: string): Promise<RolloverSummary> {
  // Get previous month (YYYY-MM)
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  // Get all data
  const transactions = await prisma.transaction.findMany({
    where: { userId }
  });

  const categories = await prisma.category.findMany({
    where: { userId, type: 'expense' }
  });

  const categoryUpdates: CategoryRolloverUpdate[] = [];
  let totalRolledOver = 0;

  // Process each category with a budget
  const budgetedCategories = categories.filter(c => c.monthlyBudget && c.monthlyBudget > 0);

  for (const category of budgetedCategories) {
    // Calculate budget status for previous month
    const status = calculateCategoryBudgetStatus(
      category as unknown as Category,
      transactions.map(t => ({ ...t, date: t.date.toISOString(), createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(), type: t.type as 'expense' | 'income' })) as unknown as Transaction[],
      monthStr
    );

    // Only rollover positive unspent amounts
    if (status && status.available > 0) {
      const newRolloverBalance = (category.rolloverBalance || 0) + status.available;

      // Update category rollover balance
      await prisma.category.update({
        where: { id: category.id },
        data: { rolloverBalance: newRolloverBalance }
      });

      categoryUpdates.push({
        categoryId: category.id,
        categoryName: category.name,
        unspent: status.available,
        newRolloverBalance,
      });

      totalRolledOver += status.available;
    }
  }

  return {
    month: monthStr,
    totalRolledOver,
    categoryUpdates,
    categoriesProcessed: budgetedCategories.length,
  };
}

/**
 * Transfer rollover balance from one category to another
 */
export async function transferRollover(
  userId: string,
  fromCategoryId: string,
  toCategoryId: string,
  amount: number
): Promise<{ from: Category; to: Category }> {
  // Validate categories belong to user
  const [fromCategory, toCategory] = await Promise.all([
    prisma.category.findFirst({ where: { id: fromCategoryId, userId } }),
    prisma.category.findFirst({ where: { id: toCategoryId, userId } }),
  ]);

  if (!fromCategory || !toCategory) {
    throw new Error('Category not found');
  }

  if ((fromCategory.rolloverBalance || 0) < amount) {
    throw new Error('Insufficient rollover balance');
  }

  // Transfer rollover balance
  const [updatedFrom, updatedTo] = await Promise.all([
    prisma.category.update({
      where: { id: fromCategoryId },
      data: { rolloverBalance: (fromCategory.rolloverBalance || 0) - amount }
    }),
    prisma.category.update({
      where: { id: toCategoryId },
      data: { rolloverBalance: (toCategory.rolloverBalance || 0) + amount }
    }),
  ]);

  return { from: updatedFrom as unknown as Category, to: updatedTo as unknown as Category };
}
