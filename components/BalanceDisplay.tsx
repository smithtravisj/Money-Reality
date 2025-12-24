'use client';

import { useMemo } from 'react';
import useAppStore from '@/lib/store';
import { calculateBalance, determineFinancialStatus } from '@/lib/balanceCalculations';
import Badge from './ui/Badge';
import styles from './BalanceDisplay.module.css';

interface BalanceDisplayProps {
  showDetails?: boolean;
}

export default function BalanceDisplay({ showDetails = true }: BalanceDisplayProps) {
  const { transactions, settings } = useAppStore();

  const data = useMemo(() => {
    const balance = calculateBalance(transactions);
    const status = determineFinancialStatus(balance, settings.safeThreshold, settings.tightThreshold);

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { balance, status, income, expenses };
  }, [transactions, settings]);

  return (
    <div className={styles.container}>
      <div className={styles.balanceCard}>
        <h3 className={styles.label}>Current Balance</h3>
        <div className={styles.amount}>
          ${data.balance.toFixed(2)}
        </div>
        <Badge variant={data.status.status === 'safe' ? 'success' : data.status.status === 'tight' ? 'warning' : 'danger'}>
          {data.status.status.charAt(0).toUpperCase() + data.status.status.slice(1)}
        </Badge>
        <p className={styles.message}>{data.status.message}</p>
      </div>

      {showDetails && (
        <div className={styles.details}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Total Income</span>
            <span className={styles.detailAmount} style={{ color: 'var(--status-safe)' }}>
              +${data.income.toFixed(2)}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Total Expenses</span>
            <span className={styles.detailAmount} style={{ color: 'var(--status-danger)' }}>
              -${data.expenses.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
