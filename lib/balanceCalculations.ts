import { Transaction, FinancialStatus, SpendingCategory, Category } from '@/types';

/**
 * Calculate total balance from all transactions
 * Balance = sum of income - sum of expenses
 * This creates a rolling balance with no monthly resets
 */
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    if (t.type === 'income') {
      return acc + t.amount;
    } else if (t.type === 'expense') {
      return acc - t.amount;
    }
    return acc;
  }, 0);
}

/**
 * Determine financial status based on balance and thresholds
 * Default thresholds: Safe >= $1000, Tight >= $200, Danger < $200
 * Thresholds can be customized in settings
 */
export function determineFinancialStatus(
  balance: number,
  safeThreshold: number | null,
  tightThreshold: number | null
): FinancialStatus {
  const safe = safeThreshold ?? 1000;
  const tight = tightThreshold ?? 200;

  if (balance >= safe) {
    return {
      balance,
      status: 'safe',
      message: 'You\'re in good shape financially',
      severity: 'info',
    };
  } else if (balance >= tight) {
    return {
      balance,
      status: 'tight',
      message: 'Watch your spending carefully',
      severity: 'warning',
    };
  } else {
    return {
      balance,
      status: 'danger',
      message: 'Critical: Your balance is dangerously low',
      severity: 'critical',
    };
  }
}

/**
 * Get spending breakdown by category
 * Shows top spending categories with amounts and percentages
 * Only includes expense transactions
 */
export function getSpendingBreakdown(
  transactions: Transaction[],
  categories: Category[]
): SpendingCategory[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpenses === 0) {
    return [];
  }

  const byCategory = expenses.reduce((acc, t) => {
    const categoryId = t.categoryId || 'uncategorized';
    acc[categoryId] = (acc[categoryId] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(byCategory)
    .map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryName: category?.name || 'Uncategorized',
        categoryId: categoryId === 'uncategorized' ? null : categoryId,
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: category?.colorTag || undefined,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate total income for a date range
 */
export function calculateIncomeInRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): number {
  return transactions
    .filter((t) => {
      const transDate = new Date(t.date);
      return t.type === 'income' && transDate >= startDate && transDate <= endDate;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate total expenses for a date range
 */
export function calculateExpensesInRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): number {
  return transactions
    .filter((t) => {
      const transDate = new Date(t.date);
      return t.type === 'expense' && transDate >= startDate && transDate <= endDate;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate average daily spending over a period
 * Useful for predictions and runway calculations
 */
export function calculateAverageDailySpending(
  transactions: Transaction[],
  days: number = 30
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentExpenses = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return t.type === 'expense' && transDate >= cutoffDate;
  });

  const totalExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
  return totalExpenses / days;
}

/**
 * Calculate average daily income over a period
 */
export function calculateAverageDailyIncome(
  transactions: Transaction[],
  days: number = 30
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentIncome = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return t.type === 'income' && transDate >= cutoffDate;
  });

  const totalIncome = recentIncome.reduce((sum, t) => sum + t.amount, 0);
  return totalIncome / days;
}

/**
 * Get spending for current calendar month
 */
export function getMonthSpending(transactions: Transaction[]): {
  income: number;
  expenses: number;
  net: number;
  days: number;
  daysPassed: number;
} {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();

  const monthTransactions = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return transDate >= startOfMonth && transDate <= now;
  });

  const income = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses,
    net: income - expenses,
    days: daysInMonth,
    daysPassed,
  };
}

/**
 * Get spending by category for a date range
 */
export function getSpendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  startDate: Date,
  endDate: Date
): SpendingCategory[] {
  const rangeTransactions = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return transDate >= startDate && transDate <= endDate && t.type === 'expense';
  });

  const totalExpenses = rangeTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpenses === 0) {
    return [];
  }

  const byCategory = rangeTransactions.reduce((acc, t) => {
    const categoryId = t.categoryId || 'uncategorized';
    acc[categoryId] = (acc[categoryId] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(byCategory)
    .map(([categoryId, amount]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryName: category?.name || 'Uncategorized',
        categoryId: categoryId === 'uncategorized' ? null : categoryId,
        amount,
        percentage: (amount / totalExpenses) * 100,
        color: category?.colorTag || undefined,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}
