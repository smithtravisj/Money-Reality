'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import MonthlySpendingHistory from '@/components/MonthlySpendingHistory';
import { getCreditCardSpendingHistory, getAutoPayAccount } from '@/lib/creditCardCalculations';
import { Account, CreditCardMonthlySpending } from '@/types';
import { ChevronLeft } from 'lucide-react';

export default function CreditCardDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const router = useRouter();
  const { accounts, transactions, loadFromDatabase } = useAppStore();
  const [cardId, setCardId] = useState<string>('');
  const [creditCard, setCreditCard] = useState<Account | null>(null);
  const [spendingHistory, setSpendingHistory] = useState<CreditCardMonthlySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setCardId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!cardId) return;

    loadFromDatabase()
      .then(() => {
        const card = accounts.find((a) => a.id === cardId && a.type === 'credit');
        if (!card) {
          router.push('/credit-cards');
          return;
        }

        setCreditCard(card);
        const history = getCreditCardSpendingHistory(transactions, cardId, 12);
        setSpendingHistory(history);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load data:', error);
        setLoading(false);
      });
  }, [cardId, accounts, transactions, loadFromDatabase, router]);

  if (loading || !creditCard) {
    return (
      <div>
        <PageHeader title="Loading..." subtitle="Credit Card" />
        <div style={{ padding: 'var(--card-padding)' }} className="page-container">
          <Card title="Loading...">
            <p style={{ color: 'var(--text-muted)' }}>Loading credit card details...</p>
          </Card>
        </div>
      </div>
    );
  }

  const currentMonth = spendingHistory.find((m) => m.isCurrentMonth);
  const autoPayAccount = getAutoPayAccount(creditCard, accounts);

  return (
    <div>
      <PageHeader
        title={creditCard.name}
        subtitle="Credit Card"
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push('/credit-cards')}
          >
            <ChevronLeft size={18} /> Back
          </Button>
        }
      />

      <div style={{ padding: 'var(--card-padding)' }} className="page-container">
        {/* Card Overview */}
        <Card title="Card Overview" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Current Balance
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text)' }}>
                {creditCard.currentBalance < 0
                  ? `Owed: $${Math.abs(creditCard.currentBalance).toFixed(2)}`
                  : `$${creditCard.currentBalance.toFixed(2)}`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Auto-Pay Account
              </div>
              <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--text)' }}>
                {autoPayAccount ? autoPayAccount.name : <em>Not set</em>}
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push(`/accounts/${creditCard.id}`)}
            >
              Edit Account
            </Button>
          </div>
        </Card>

        {/* Current Month */}
        {currentMonth && (
          <Card title={`Current Month (${currentMonth.monthName} ${currentMonth.year})`} style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Spent
                </div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text)' }}>
                  ${currentMonth.spent.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Transactions
                </div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text)' }}>
                  {currentMonth.transactionCount}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Monthly Spending History */}
        <Card title="Monthly Spending History">
          <MonthlySpendingHistory
            history={spendingHistory}
            highlightCurrent={true}
          />
        </Card>
      </div>
    </div>
  );
}
