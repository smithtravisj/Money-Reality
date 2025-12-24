'use client';

import { useState, useMemo } from 'react';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { getMonthSpending } from '@/lib/balanceCalculations';

function getWeekBoundaries() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is Sunday

  const monday = new Date(now.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  return { monday, sunday };
}

export default function WeeklyCheckinPage() {
  const { transactions, addWeeklyCheckin, weeklyCheckins } = useAppStore();

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { monday, sunday } = useMemo(() => getWeekBoundaries(), []);

  // Calculate week data
  const weekData = useMemo(() => {
    const weekTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= monday && date <= sunday;
    });

    const income = weekTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = weekTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netChange = income - expenses;

    // Calculate starting balance
    const transactionsBeforeWeek = transactions.filter((t) => new Date(t.date) < monday);
    const startingBalance = transactionsBeforeWeek.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);

    const endingBalance = startingBalance + netChange;

    return {
      income,
      expenses,
      netChange,
      startingBalance,
      endingBalance,
      transactionCount: weekTransactions.length,
    };
  }, [transactions, monday, sunday]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await addWeeklyCheckin({
        weekStartDate: monday.toISOString(),
        weekEndDate: sunday.toISOString(),
        totalIncome: weekData.income,
        totalExpenses: weekData.expenses,
        netChange: weekData.netChange,
        startingBalance: weekData.startingBalance,
        endingBalance: weekData.endingBalance,
        reflectionNotes: notes,
      });

      setNotes('');
      alert('Weekly check-in saved successfully!');
    } catch (err) {
      setError('Failed to save check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const monthData = getMonthSpending(transactions);

  return (
    <div style={{ padding: 'var(--card-padding)' }} className="page-container-narrow">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 className="page-title">Weekly Check-in</h1>
        <p className="page-subtitle">
          {monday.toLocaleDateString()} – {sunday.toLocaleDateString()}
        </p>
      </div>

      {/* Summary Card */}
      <Card title="Week Summary" style={{ marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Starting Balance
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text)' }}>
              ${weekData.startingBalance.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Income
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-safe)' }}>
              +${weekData.income.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Expenses
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--status-danger)' }}>
              -${weekData.expenses.toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Ending Balance
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: '700',
                color: weekData.netChange >= 0 ? 'var(--status-safe)' : 'var(--status-danger)',
              }}
            >
              ${weekData.endingBalance.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Reflection Form */}
      <Card title="Weekly Reflection" style={{ marginBottom: 'var(--space-4)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Textarea
            label="How was your week financially?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reflect on your spending, savings, and financial goals this week..."
          />

          {error && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-3)',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger)',
                borderRadius: 'var(--radius-control)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" loading={loading}>
            Save Check-in
          </Button>
        </form>
      </Card>

      {/* Previous Check-ins */}
      {weeklyCheckins.length > 0 && (
        <Card title="Previous Check-ins" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {weeklyCheckins.slice(0, 4).map((checkin) => (
              <div key={checkin.id} style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {new Date(checkin.weekStartDate).toLocaleDateString()} – {new Date(checkin.weekEndDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                      Net Change: {checkin.netChange >= 0 ? '+' : ''}${checkin.netChange.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Income vs Expenses</div>
                    <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                      ${checkin.totalIncome.toFixed(2)} vs ${checkin.totalExpenses.toFixed(2)}
                    </div>
                  </div>
                </div>
                {checkin.reflectionNotes && (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: '0', fontStyle: 'italic' }}>
                    "{checkin.reflectionNotes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Month Overview */}
      <Card title="Month Overview">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              This Month
            </div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text)' }}>
              {monthData.daysPassed} of {monthData.days} days passed
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Month Net
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: '700',
                color: monthData.net >= 0 ? 'var(--status-safe)' : 'var(--status-danger)',
              }}
            >
              {monthData.net >= 0 ? '+' : ''}${monthData.net.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
