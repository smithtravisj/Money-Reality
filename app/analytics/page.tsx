'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  calculateBalance,
  calculateAverageDailySpending,
  calculateAverageDailyIncome,
  getMonthSpending,
  getSpendingBreakdown,
  getAccountBalances,
  calculateBudgetSummary,
} from '@/lib/balanceCalculations';
import { Download, ChevronDown } from 'lucide-react';

export default function AnalyticsPage() {
  const { transactions, categories, accounts } = useAppStore();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(1); // 1 = last month, 2 = two months ago, etc.
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMonthDropdown(false);
      }
    }

    if (showMonthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthDropdown]);

  const analytics = useMemo(() => {
    const currentBalance = calculateBalance(transactions);
    const avgDailySpending = calculateAverageDailySpending(transactions, 30);
    const avgDailyIncome = calculateAverageDailyIncome(transactions, 30);
    const monthData = getMonthSpending(transactions);
    const breakdown = getSpendingBreakdown(transactions, categories);
    const accountBalances = getAccountBalances(transactions, accounts);

    // Get current month in YYYY-MM format
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const budgetSummary = calculateBudgetSummary(categories, transactions, currentMonth);

    // Calculate income and expenses for selected past month
    const selectedMonth = new Date(now.getFullYear(), now.getMonth() - selectedMonthOffset, 1);
    const selectedMonthEnd = new Date(now.getFullYear(), now.getMonth() - selectedMonthOffset + 1, 0);

    const selectedMonthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= selectedMonth && tDate <= selectedMonthEnd;
    });
    const selectedMonthIncome = selectedMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const selectedMonthExpenses = selectedMonthTransactions
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
      accountBalances,
      budgetSummary,
      selectedMonthIncome,
      selectedMonthExpenses,
      selectedMonth,
      totalIncome,
      totalExpenses,
      transactionCount: transactions.length,
    };
  }, [transactions, categories, accounts, selectedMonthOffset]);

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
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Your financial overview and statistics"
        actions={
          <Button variant="secondary" size="md" onClick={handleExport}>
            <Download size={18} /> Export CSV
          </Button>
        }
      />
      <div style={{ padding: 'var(--card-padding)' }} className="page-container">

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

      {/* Monthly Summary */}
      <Card
        title={`Current Month • ${analytics.monthData.daysPassed}/${analytics.monthData.days} days`}
        style={{ marginBottom: 'var(--space-4)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
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

      {/* Past Month Summary */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
        <Card style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '600',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {analytics.selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                <ChevronDown size={18} color="var(--text-muted)" strokeWidth={3} style={{ transform: 'translateY(-2px)' }} />
              </button>

              {showMonthDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '8px',
                    minWidth: '200px',
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-control)',
                    zIndex: 50,
                    maxHeight: '280px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0,
                    padding: 0,
                  }}
            >
              {Array.from({ length: 24 }, (_, i) => {
                // Show last 24 months (excluding current month), with selected month highlighted
                const monthOffset = i + 1; // Start from 1 (last month), go up to 24

                const now = new Date();
                const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
                const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const isSelected = selectedMonthOffset === monthOffset;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedMonthOffset(monthOffset);
                      setShowMonthDropdown(false);
                    }}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--text)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      transition: 'background-color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {monthLabel}
                  </button>
                );
              })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Income</div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-safe)' }}>
                ${analytics.selectedMonthIncome.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Expenses</div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-danger)' }}>
                ${analytics.selectedMonthExpenses.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>Net</div>
              <div
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: '700',
                  color: analytics.selectedMonthIncome - analytics.selectedMonthExpenses >= 0 ? 'var(--status-safe)' : 'var(--status-danger)',
                }}
              >
                {analytics.selectedMonthIncome - analytics.selectedMonthExpenses >= 0 ? '+' : ''}${(analytics.selectedMonthIncome - analytics.selectedMonthExpenses).toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      </div>

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
        <Card title="Top Spending Categories" style={{ marginBottom: 'var(--space-4)' }}>
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

      {/* Account Breakdown */}
      {analytics.accountBalances.length > 0 && (
        <Card title="Account Breakdown" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {analytics.accountBalances.map((account) => (
              <div
                key={account.accountId}
                style={{
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--panel-2)',
                  borderRadius: 'var(--radius-control)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {account.accountName}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text)' }}>
                    {account.displayBalance}
                  </div>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {account.transactionCount} transaction{account.transactionCount !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Budget vs Actual */}
      {analytics.budgetSummary.categories.length > 0 && (
        <Card title="Budget vs Actual (Current Month)" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Total Budgeted
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text)' }}>
                ${analytics.budgetSummary.totalBudgeted.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Total Spent
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-danger)' }}>
                ${analytics.budgetSummary.totalSpent.toFixed(2)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Remaining
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: '700',
                  color: analytics.budgetSummary.totalAvailable >= 0 ? 'var(--status-safe)' : 'var(--status-danger)',
                }}
              >
                ${analytics.budgetSummary.totalAvailable.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Overall Usage: {Math.round(analytics.budgetSummary.overallPercentUsed)}%
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
                  width: `${Math.min(analytics.budgetSummary.overallPercentUsed, 100)}%`,
                  backgroundColor:
                    analytics.budgetSummary.categoriesOverBudget > 0
                      ? 'var(--status-danger)'
                      : analytics.budgetSummary.overallPercentUsed > 80
                      ? 'var(--status-tight)'
                      : 'var(--status-safe)',
                }}
              />
            </div>
          </div>

          {analytics.budgetSummary.categoriesOverBudget > 0 && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger)',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {analytics.budgetSummary.categoriesOverBudget} category{analytics.budgetSummary.categoriesOverBudget !== 1 ? 'ies' : ''} over budget
            </div>
          )}
        </Card>
      )}
      </div>
    </div>
  );
}
