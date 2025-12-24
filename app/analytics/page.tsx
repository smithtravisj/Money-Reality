'use client';

import { useMemo } from 'react';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  calculateBalance,
  calculateAverageDailySpending,
  calculateAverageDailyIncome,
  getMonthSpending,
  getSpendingBreakdown,
} from '@/lib/balanceCalculations';
import { Download } from 'lucide-react';

export default function AnalyticsPage() {
  const { transactions, categories } = useAppStore();

  const analytics = useMemo(() => {
    const currentBalance = calculateBalance(transactions);
    const avgDailySpending = calculateAverageDailySpending(transactions, 30);
    const avgDailyIncome = calculateAverageDailyIncome(transactions, 30);
    const monthData = getMonthSpending(transactions);
    const breakdown = getSpendingBreakdown(transactions, categories);

    // Calculate income and expenses for various periods
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30Transactions = transactions.filter((t) => new Date(t.date) >= thirtyDaysAgo);
    const last30Income = last30Transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const last30Expenses = last30Transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // All-time statistics
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      currentBalance,
      avgDailySpending,
      avgDailyIncome,
      monthData,
      breakdown,
      last30Income,
      last30Expenses,
      totalIncome,
      totalExpenses,
      transactionCount: transactions.length,
    };
  }, [transactions, categories]);

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Category', 'Merchant', 'Notes'],
      ...transactions.map((t) => [
        new Date(t.date).toISOString(),
        t.type,
        t.amount,
        categories.find((c) => c.id === t.categoryId)?.name || 'Uncategorized',
        t.merchant || '',
        t.notes || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `money-reality-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div style={{ padding: 'var(--card-padding)' }} className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Your financial overview and statistics</p>
        </div>
        <Button variant="secondary" size="md" onClick={handleExport}>
          <Download size={18} /> Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--grid-gap)', marginBottom: 'var(--space-4)' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Current Balance
            </div>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--text)' }}>
              ${analytics.currentBalance.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Avg Daily Spending (30d)
            </div>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--status-danger)' }}>
              ${analytics.avgDailySpending.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Avg Daily Income (30d)
            </div>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--status-safe)' }}>
              ${analytics.avgDailyIncome.toFixed(2)}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Total Transactions
            </div>
            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: '700', color: 'var(--text)' }}>
              {analytics.transactionCount}
            </div>
          </div>
        </Card>
      </div>

      {/* 30-Day Summary */}
      <Card title="Last 30 Days" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Income</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-safe)' }}>
              ${analytics.last30Income.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Expenses</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-danger)' }}>
              ${analytics.last30Expenses.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Net</div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: '700',
                color: analytics.last30Income - analytics.last30Expenses >= 0 ? 'var(--status-safe)' : 'var(--status-danger)',
              }}
            >
              {analytics.last30Income - analytics.last30Expenses >= 0 ? '+' : ''}${(analytics.last30Income - analytics.last30Expenses).toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly Summary */}
      <Card title="Current Month" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Days Passed
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text)' }}>
              {analytics.monthData.daysPassed}/{analytics.monthData.days}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Income</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-safe)' }}>
              ${analytics.monthData.income.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Expenses</div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-danger)' }}>
              ${analytics.monthData.expenses.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Net</div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: '700',
                color: analytics.monthData.net >= 0 ? 'var(--status-safe)' : 'var(--status-danger)',
              }}
            >
              {analytics.monthData.net >= 0 ? '+' : ''}${analytics.monthData.net.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* All-Time Statistics */}
      <Card title="All-Time Statistics" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Total Income
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-safe)' }}>
              ${analytics.totalIncome.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Total Expenses
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-danger)' }}>
              ${analytics.totalExpenses.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Total Balance
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: '700',
                color: analytics.currentBalance >= 0 ? 'var(--status-safe)' : 'var(--status-danger)',
              }}
            >
              {analytics.currentBalance >= 0 ? '+' : ''}${analytics.currentBalance.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Top Spending Categories */}
      {analytics.breakdown.length > 0 && (
        <Card title="Top Spending Categories">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {analytics.breakdown.slice(0, 5).map((item) => (
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

                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'var(--panel-2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${item.percentage}%`,
                      backgroundColor: item.color || 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
