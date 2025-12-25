import {
  Transaction,
  FinancialStatus,
  SpendingCategory,
  Category,
  Account,
  BudgetStatus,
  BudgetSummary,
  AccountBalance,
} from '@/types';

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

/**
 * Calculate balance for a specific account
 * Sums all income and expense transactions for that account
 */
export function calculateAccountBalance(
  transactions: Transaction[],
  accountId: string
): number {
  return transactions
    .filter((t) => t.accountId === accountId)
    .reduce((acc, t) => {
      if (t.type === 'income') {
        return acc + t.amount;
      } else if (t.type === 'expense') {
        return acc - t.amount;
      }
      return acc;
    }, 0);
}

/**
 * Calculate balances for all accounts
 * Returns a map of accountId -> balance
 * Uses currentBalance from database (already kept in sync with transactions by the API)
 */
export function calculateAllAccountBalances(
  _transactions: Transaction[],
  accounts: Account[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  accounts.forEach((account) => {
    // Use the account's current balance from the database
    // (it's already kept in sync with transactions by the API)
    balances[account.id] = account.currentBalance;
  });

  return balances;
}

/**
 * Get account balances with metadata and display formatting
 * Includes account names, types, and properly formatted display balances
 * Credit cards display as "Owed: $X" when negative
 */
export function getAccountBalances(
  transactions: Transaction[],
  accounts: Account[]
): AccountBalance[] {
  const { formatCurrency } = require('@/lib/formatters');
  const balances = calculateAllAccountBalances(transactions, accounts);

  return accounts.map((account) => {
    const balance = balances[account.id];
    const transactionCount = transactions.filter(
      (t) => t.accountId === account.id
    ).length;

    let displayBalance: string;
    if (account.type === 'credit' && balance < 0) {
      displayBalance = `Owed: $${formatCurrency(Math.abs(balance))}`;
    } else if (balance < 0) {
      displayBalance = `-$${formatCurrency(Math.abs(balance))}`;
    } else {
      displayBalance = `$${formatCurrency(balance)}`;
    }

    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      balance,
      transactionCount,
      displayBalance,
    };
  });
}

/**
 * Calculate total net worth across all accounts
 * Sum of all account balances
 */
export function calculateTotalNetWorth(
  transactions: Transaction[],
  accounts: Account[]
): number {
  const balances = calculateAllAccountBalances(transactions, accounts);
  return Object.values(balances).reduce((sum, balance) => sum + balance, 0);
}

/**
 * Calculate budget status for a single category
 * Shows budgeted, spent, and available amounts with percentage
 * Month format: YYYY-MM
 */
export function calculateCategoryBudgetStatus(
  category: Category,
  transactions: Transaction[],
  month: string
): BudgetStatus | null {
  // If no budget is set for this category, return null
  if (!category.monthlyBudget) {
    return null;
  }

  // Parse month string (YYYY-MM) to get date range
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0);

  // Get spending for this category in the month
  const spent = transactions
    .filter((t) => {
      const transDate = new Date(t.date);
      return (
        t.type === 'expense' &&
        t.categoryId === category.id &&
        transDate >= startDate &&
        transDate <= endDate
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const budgeted = category.monthlyBudget;
  const available = budgeted - spent;
  const rollover = category.rolloverBalance || 0;
  const totalAvailable = available + rollover;
  const percentUsed = (spent / budgeted) * 100;

  return {
    categoryId: category.id,
    categoryName: category.name,
    budgeted,
    spent,
    available,
    rollover,
    totalAvailable,
    percentUsed,
    overspent: spent > budgeted,
  };
}

/**
 * Calculate overall budget summary for a month
 * Shows total budgeted, spent, available and breakdown by category
 * Month format: YYYY-MM
 */
export function calculateBudgetSummary(
  categories: Category[],
  transactions: Transaction[],
  month: string
): BudgetSummary {
  // Get all category budgets for this month
  const categoryStatuses: BudgetStatus[] = [];
  let totalBudgeted = 0;
  let totalSpent = 0;
  let categoriesOverBudget = 0;

  categories.forEach((category) => {
    if (category.type === 'expense' && category.monthlyBudget) {
      const status = calculateCategoryBudgetStatus(category, transactions, month);
      if (status) {
        categoryStatuses.push(status);
        totalBudgeted += status.budgeted;
        totalSpent += status.spent;
        if (status.overspent) {
          categoriesOverBudget += 1;
        }
      }
    }
  });

  const totalAvailable = totalBudgeted - totalSpent;
  const overallPercentUsed =
    totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return {
    month,
    totalBudgeted,
    totalSpent,
    totalAvailable,
    categories: categoryStatuses.sort((a, b) => b.spent - a.spent),
    overallPercentUsed,
    categoriesOverBudget,
  };
}

/**
 * Get spending breakdown by category for a specific month
 * Similar to getSpendingByCategory but for a specific month
 * Month format: YYYY-MM
 */
export function getMonthlySpendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  month: string
): SpendingCategory[] {
  // Parse month string (YYYY-MM) to get date range
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0);

  const monthTransactions = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return (
      t.type === 'expense' &&
      transDate >= startDate &&
      transDate <= endDate
    );
  });

  const totalExpenses = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpenses === 0) {
    return [];
  }

  const byCategory = monthTransactions.reduce((acc, t) => {
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
