import { Transaction, PredictiveInsight } from '@/types';

/**
 * Calculate how many days until balance runs out at current spending rate
 * Based on last 30 days of spending data
 */
export function calculateBalanceRunway(
  currentBalance: number,
  transactions: Transaction[]
): PredictiveInsight {
  if (currentBalance <= 0) {
    return {
      type: 'runway',
      title: 'Balance Runway',
      message: 'You have already spent more than your balance',
      value: '0 days',
      severity: 'critical',
    };
  }

  // Calculate average daily spending from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentExpenses = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return t.type === 'expense' && transDate >= thirtyDaysAgo;
  });

  const totalExpenses = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
  const avgDailySpending = totalExpenses / 30;

  if (avgDailySpending === 0) {
    return {
      type: 'runway',
      title: 'Balance Runway',
      message: 'No recent spending data to calculate runway',
      value: 'Unable to calculate',
      severity: 'info',
    };
  }

  const daysRemaining = Math.floor(currentBalance / avgDailySpending);

  let severity: 'info' | 'warning' | 'critical' = 'info';
  if (daysRemaining < 7) {
    severity = 'critical';
  } else if (daysRemaining < 30) {
    severity = 'warning';
  }

  const message = `At your current spending rate of $${avgDailySpending.toFixed(2)}/day, your balance will last ${daysRemaining} days`;

  return {
    type: 'runway',
    title: 'Balance Runway',
    message,
    value: `${daysRemaining} days`,
    severity,
  };
}

/**
 * Estimate balance at end of current month
 * Based on current month's spending rate and remaining days
 */
export function calculateEndOfMonthEstimate(
  currentBalance: number,
  transactions: Transaction[]
): PredictiveInsight {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();

  // Get month transactions so far
  const monthTransactions = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return transDate >= startOfMonth && transDate <= now;
  });

  const monthExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  if (daysPassed === 0) {
    return {
      type: 'end_of_month',
      title: 'End of Month Estimate',
      message: 'Not enough data to estimate',
      value: 'N/A',
      severity: 'info',
    };
  }

  // Calculate remaining days and project
  const daysRemaining = daysInMonth - daysPassed;
  const avgDailyExpenses = monthExpenses / daysPassed;
  const avgDailyIncome = monthIncome / daysPassed;

  const projectedExpenses = avgDailyExpenses * daysRemaining;
  const projectedIncome = avgDailyIncome * daysRemaining;

  const estimatedEndBalance = currentBalance + projectedIncome - projectedExpenses;

  let severity: 'info' | 'warning' | 'critical' = 'info';
  if (estimatedEndBalance < 0) {
    severity = 'critical';
  } else if (estimatedEndBalance < 200) {
    severity = 'warning';
  }

  const message = `Based on this month's pace, you'll have $${estimatedEndBalance.toFixed(2)} at month end`;

  return {
    type: 'end_of_month',
    title: 'End of Month Estimate',
    message,
    value: `$${estimatedEndBalance.toFixed(2)}`,
    severity,
  };
}

/**
 * Detect accelerating spending
 * Compares spending from last 7 days to previous 7 days
 * Returns insight if spending increased by more than 20%
 */
export function detectAcceleratingSpending(
  transactions: Transaction[]
): PredictiveInsight | null {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Last 7 days
  const lastWeek = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return (
      t.type === 'expense' &&
      transDate >= sevenDaysAgo &&
      transDate <= now
    );
  });

  // Previous 7 days
  const previousWeek = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return (
      t.type === 'expense' &&
      transDate >= fourteenDaysAgo &&
      transDate < sevenDaysAgo
    );
  });

  const lastWeekTotal = lastWeek.reduce((sum, t) => sum + t.amount, 0);
  const previousWeekTotal = previousWeek.reduce((sum, t) => sum + t.amount, 0);

  // If no previous week data, can't compare
  if (previousWeekTotal === 0) {
    return null;
  }

  const increase = ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;

  // Only alert if increase is significant (> 20%)
  if (increase > 20) {
    let severity: 'info' | 'warning' | 'critical' = 'warning';
    if (increase > 50) {
      severity = 'critical';
    }

    const message = `Your spending is up ${increase.toFixed(0)}% from last week ($${lastWeekTotal.toFixed(2)} vs $${previousWeekTotal.toFixed(2)})`;

    return {
      type: 'accelerating_spending',
      title: 'Spending Alert',
      message,
      value: `+${increase.toFixed(0)}%`,
      severity,
    };
  }

  return null;
}

/**
 * Detect category-specific spending spikes
 * Identifies if a category's spending is significantly higher than usual
 */
export function detectCategorySpike(
  transactions: Transaction[],
  categoryId: string,
  days: number = 30
): PredictiveInsight | null {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const categoryTransactions = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return (
      t.categoryId === categoryId &&
      t.type === 'expense' &&
      transDate >= cutoffDate
    );
  });

  if (categoryTransactions.length === 0) {
    return null;
  }

  const totalSpending = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgSpending = totalSpending / (days / 7); // average per week

  // Look at last 7 days
  const lastWeekCutoff = new Date();
  lastWeekCutoff.setDate(lastWeekCutoff.getDate() - 7);

  const lastWeekTransactions = categoryTransactions.filter((t) => {
    const transDate = new Date(t.date);
    return transDate >= lastWeekCutoff;
  });

  const lastWeekTotal = lastWeekTransactions.reduce((sum, t) => sum + t.amount, 0);

  if (lastWeekTotal > avgSpending * 1.5) {
    return {
      type: 'accelerating_spending',
      title: 'Category Spike Detected',
      message: `Spending in this category is ${((lastWeekTotal / avgSpending - 1) * 100).toFixed(0)}% above average`,
      value: `$${lastWeekTotal.toFixed(2)}`,
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Get all active predictive insights
 * Consolidates runway, end-of-month, and accelerating spending insights
 */
export function getAllPredictiveInsights(
  currentBalance: number,
  transactions: Transaction[]
): PredictiveInsight[] {
  const insights: PredictiveInsight[] = [];

  // Balance runway
  insights.push(calculateBalanceRunway(currentBalance, transactions));

  // End of month estimate
  insights.push(calculateEndOfMonthEstimate(currentBalance, transactions));

  // Accelerating spending
  const accelerating = detectAcceleratingSpending(transactions);
  if (accelerating) {
    insights.push(accelerating);
  }

  // Sort by severity (critical first)
  return insights.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
