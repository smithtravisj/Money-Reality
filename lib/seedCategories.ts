import { prisma } from '@/lib/prisma';

interface CategoryData {
  name: string;
  type: 'expense' | 'income';
  parentGroup: string;
  icon?: string;
  colorTag?: string;
}

const DEFAULT_CATEGORIES: CategoryData[] = [
  // Essentials - Expense
  { name: 'Groceries', type: 'expense', parentGroup: 'Essentials' },
  { name: 'Rent', type: 'expense', parentGroup: 'Essentials' },
  { name: 'Utilities', type: 'expense', parentGroup: 'Essentials' },
  { name: 'Transport', type: 'expense', parentGroup: 'Essentials' },

  // Lifestyle - Expense
  { name: 'Dining', type: 'expense', parentGroup: 'Lifestyle' },
  { name: 'Entertainment', type: 'expense', parentGroup: 'Lifestyle' },
  { name: 'Shopping', type: 'expense', parentGroup: 'Lifestyle' },

  // Health - Expense
  { name: 'Medical', type: 'expense', parentGroup: 'Health' },
  { name: 'Fitness', type: 'expense', parentGroup: 'Health' },
  { name: 'Wellness', type: 'expense', parentGroup: 'Health' },

  // Personal - Expense
  { name: 'Subscriptions', type: 'expense', parentGroup: 'Personal' },
  { name: 'Services', type: 'expense', parentGroup: 'Personal' },
  { name: 'Miscellaneous', type: 'expense', parentGroup: 'Personal' },

  // Income
  { name: 'Salary', type: 'income', parentGroup: 'Income' },
  { name: 'Freelance', type: 'income', parentGroup: 'Income' },
  { name: 'Other Income', type: 'income', parentGroup: 'Income' },
];

/**
 * Create default categories for a new user
 * Called during signup to set up initial category structure
 */
export async function seedCategories(userId: string): Promise<void> {
  try {
    // Check if user already has categories
    const existingCount = await prisma.category.count({
      where: { userId },
    });

    if (existingCount > 0) {
      console.log(`User ${userId} already has categories, skipping seed`);
      return;
    }

    // Create all default categories
    const categories = await Promise.all(
      DEFAULT_CATEGORIES.map((cat, index) =>
        prisma.category.create({
          data: {
            userId,
            name: cat.name,
            type: cat.type,
            parentGroup: cat.parentGroup,
            icon: cat.icon || null,
            colorTag: cat.colorTag || null,
            order: index + 1,
          },
        })
      )
    );

    console.log(`Created ${categories.length} default categories for user ${userId}`);
  } catch (error) {
    console.error(`Failed to seed categories for user ${userId}:`, error);
    // Don't throw - let signup continue even if category seeding fails
    // User can manually create categories later
  }
}
