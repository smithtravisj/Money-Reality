'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { calculateBalance, determineFinancialStatus } from '@/lib/balanceCalculations';
import { getAllPredictiveInsights } from '@/lib/predictions';

export default function Dashboard() {
  const { status } = useSession();
  const { initializeStore, transactions, settings, loading } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize store on mount
  useEffect(() => {
    if (status === 'authenticated') {
      initializeStore()
        .then(() => setIsInitialized(true))
        .catch((error) => {
          console.error('Failed to initialize store:', error);
          setIsInitialized(true); // Mark as initialized even on error
        });
    }
  }, [status, initializeStore]);

  // Redirect unauthenticated users to login
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (status === 'loading' || !isInitialized || loading) {
    return (
      <div style={{ padding: 'var(--card-padding)' }}>
        <Card title="Loading...">
          <p style={{ color: 'var(--text-muted)' }}>Loading your financial data...</p>
        </Card>
      </div>
    );
  }

  // Calculate balance
  const balance = calculateBalance(transactions);
  const financialStatus = determineFinancialStatus(
    balance,
    settings.safeThreshold,
    settings.tightThreshold
  );

  // Get predictive insights
  const insights = getAllPredictiveInsights(balance, transactions);

  return (
    <div style={{ padding: 'var(--card-padding)' }} className="page-container-narrow">
      {/* Page Title */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your financial snapshot</p>
      </div>

      {/* Balance Card */}
      <Card
        title="Current Balance"
        subtitle={financialStatus.message}
        action={
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-control)',
              backgroundColor: `var(--status-${financialStatus.status}-bg)`,
              color: `var(--status-${financialStatus.status})`,
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
            }}
          >
            {financialStatus.status.charAt(0).toUpperCase() + financialStatus.status.slice(1)}
          </div>
        }
        className="dashboard-grid-4"
        style={{ marginBottom: 'var(--space-4)' }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: '700', color: 'var(--text)' }}>
            ${balance.toFixed(2)}
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>Available funds</p>
        </div>
      </Card>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--grid-gap)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            window.location.href = '/add-expense';
          }}
          style={{
            width: '100%',
            justifyContent: 'center',
          }}
        >
          Add Expense
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            window.location.href = '/add-income';
          }}
          style={{
            width: '100%',
            justifyContent: 'center',
          }}
        >
          Add Income
        </Button>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <Card title="Insights" style={{ marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            {insights.map((insight, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: `var(--status-${insight.severity}-bg)`,
                  borderLeft: `3px solid var(--status-${insight.severity})`,
                }}
              >
                <div style={{ color: `var(--status-${insight.severity})`, fontWeight: '600' }}>
                  {insight.title}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                  {insight.message}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {transactions.length === 0 && (
        <Card title="Get Started">
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No transactions yet. Start tracking your expenses and income!</p>
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card title="Recent Transactions" style={{ marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-2)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', color: 'var(--text)' }}>
                    {transaction.merchant || 'Uncategorized'}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: '600',
                    color: transaction.type === 'income' ? 'var(--status-safe)' : 'var(--text)',
                  }}
                >
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
