import { Transaction, Account, CreditCardMonthlySpending, CreditCardSummary } from '@/types';

/**
 * Calculate spending for a credit card in a specific month
 * Only counts expense transactions (not payments/income)
 */
export function calculateCreditCardMonthSpending(
  transactions: Transaction[],
  cardId: string,
  month: string // 'YYYY-MM'
): number {
  const [year, monthNum] = month.split('-').map(Number);

  return transactions
    .filter((t) => {
      if (t.accountId !== cardId || t.type !== 'expense') return false;

      const txDate = new Date(t.date);
      return txDate.getFullYear() === year && txDate.getMonth() + 1 === monthNum;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get current month spending for a credit card
 */
export function getCurrentMonthSpending(transactions: Transaction[], cardId: string): number {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return calculateCreditCardMonthSpending(transactions, cardId, month);
}

/**
 * Get spending history for a credit card
 * Groups transactions by month, sorted newest to oldest
 */
export function getCreditCardSpendingHistory(
  transactions: Transaction[],
  cardId: string,
  monthsBack: number = 12
): CreditCardMonthlySpending[] {
  const cardTransactions = transactions.filter((t) => t.accountId === cardId && t.type === 'expense');

  // Get unique month/year combinations
  const monthsSet = new Set<string>();
  cardTransactions.forEach((t) => {
    const date = new Date(t.date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(month);
  });

  // Get current month for comparison
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Create array of months and calculate spending
  const monthlyData: CreditCardMonthlySpending[] = Array.from(monthsSet)
    .sort()
    .reverse()
    .slice(0, monthsBack)
    .map((month) => {
      const [year, monthNum] = month.split('-').map(Number);
      const monthDate = new Date(year, monthNum - 1, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });

      const spent = calculateCreditCardMonthSpending(cardTransactions, cardId, month);
      const transactionCount = cardTransactions.filter((t) => {
        const txDate = new Date(t.date);
        return txDate.getFullYear() === year && txDate.getMonth() + 1 === monthNum;
      }).length;

      return {
        month,
        year,
        monthNum,
        monthName,
        spent,
        transactionCount,
        isCurrentMonth: month === currentMonth,
      };
    });

  // Ensure we have the current month, even if there are no transactions
  if (!monthlyData.some((m) => m.isCurrentMonth)) {
    const now = new Date();
    const year = now.getFullYear();
    const monthNum = now.getMonth() + 1;
    const month = `${year}-${String(monthNum).padStart(2, '0')}`;
    const monthDate = new Date(year, monthNum - 1, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long' });

    monthlyData.unshift({
      month,
      year,
      monthNum,
      monthName,
      spent: 0,
      transactionCount: 0,
      isCurrentMonth: true,
    });
  }

  return monthlyData;
}

/**
 * Get auto-pay account for a credit card
 * Returns account details or null if not set
 */
export function getAutoPayAccount(
  creditCard: Account,
  accounts: Account[]
): Account | null {
  if (!creditCard.autoPayAccountId) return null;

  const autoPayAccount = accounts.find((a) => a.id === creditCard.autoPayAccountId);
  return autoPayAccount || null;
}

/**
 * Get summary for all credit cards
 * Includes current month spending and auto-pay info
 */
export function getCreditCardsSummary(
  transactions: Transaction[],
  accounts: Account[]
): CreditCardSummary[] {
  const creditCards = accounts.filter((a) => a.type === 'credit');

  return creditCards.map((card) => {
    const currentMonthSpending = getCurrentMonthSpending(transactions, card.id);
    const currentMonthTransactions = transactions.filter((t) => {
      if (t.accountId !== card.id || t.type !== 'expense') return false;

      const now = new Date();
      const txDate = new Date(t.date);
      return (
        txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth()
      );
    });

    const autoPayAccount = getAutoPayAccount(card, accounts);

    return {
      cardId: card.id,
      cardName: card.name,
      currentBalance: card.currentBalance,
      currentMonthSpending,
      currentMonthTransactionCount: currentMonthTransactions.length,
      autoPayAccount: autoPayAccount
        ? {
            id: autoPayAccount.id,
            name: autoPayAccount.name,
            type: autoPayAccount.type as 'checking' | 'savings' | 'credit' | 'cash',
          }
        : null,
    };
  });
}

/**
 * Get total spending for all credit cards in current month
 */
export function getTotalCreditCardSpendingCurrentMonth(
  transactions: Transaction[],
  accounts: Account[]
): number {
  const creditCards = accounts.filter((a) => a.type === 'credit');
  return creditCards.reduce((sum, card) => sum + getCurrentMonthSpending(transactions, card.id), 0);
}
