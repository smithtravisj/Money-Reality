'use client';

import { useMemo } from 'react';
import useAppStore from '@/lib/store';
import Card from './ui/Card';
import { getSpendingBreakdown } from '@/lib/balanceCalculations';

interface SpendingBreakdownProps {
  limit?: number;
}

export default function SpendingBreakdown({ limit = 5 }: SpendingBreakdownProps) {
  const { transactions, categories } = useAppStore();

  const breakdown = useMemo(() => {
    return getSpendingBreakdown(transactions, categories).slice(0, limit);
  }, [transactions, categories, limit]);

  if (breakdown.length === 0) {
    return (
      <Card title="Spending Breakdown">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
          No spending data yet. Add expenses to see your breakdown.
        </p>
      </Card>
    );
  }

  const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card title="Spending Breakdown">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {breakdown.map((item, index) => (
          <div key={item.categoryId || 'uncategorized'}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontWeight: '500', color: 'var(--text)' }}>{item.categoryName}</span>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: '8px',
                backgroundColor: 'var(--panel-2)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: index === breakdown.length - 1 ? '0' : 'var(--space-3)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${item.percentage}%`,
                  backgroundColor: item.color || 'var(--accent)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ))}

        {/* Summary */}
        <div
          style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: '600', color: 'var(--text)' }}>Total Spending</span>
          <span style={{ fontWeight: '700', color: 'var(--status-danger)', fontSize: 'var(--font-size-lg)' }}>
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}
