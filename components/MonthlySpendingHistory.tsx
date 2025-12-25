'use client';

import { CreditCardMonthlySpending } from '@/types';

interface MonthlySpendingHistoryProps {
  history: CreditCardMonthlySpending[];
  highlightCurrent?: boolean;
}

export default function MonthlySpendingHistory({ history, highlightCurrent = true }: MonthlySpendingHistoryProps) {
  if (history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)' }}>
        <p>No spending history yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {history.map((month, idx) => (
        <div
          key={`${month.year}-${month.monthNum}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 'var(--space-3)',
            alignItems: 'center',
            padding: 'var(--space-3)',
            backgroundColor: highlightCurrent && month.isCurrentMonth ? 'var(--panel)' : 'transparent',
            borderBottom: idx < history.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div>
            <div style={{ fontWeight: '500', color: 'var(--text)' }}>
              {month.monthName} {month.year}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              {month.transactionCount} transaction{month.transactionCount !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--text)' }}>
            ${month.spent.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
