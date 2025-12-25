'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CreditCardList from '@/components/CreditCardList';
import { getCreditCardsSummary } from '@/lib/creditCardCalculations';
import { CreditCardSummary } from '@/types';

export default function CreditCardsPage() {
  const router = useRouter();
  const { accounts, transactions, loadFromDatabase } = useAppStore();
  const [creditCards, setCreditCards] = useState<CreditCardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromDatabase()
      .then(() => {
        const cards = getCreditCardsSummary(transactions, accounts);
        setCreditCards(cards);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load data:', error);
        setLoading(false);
      });
  }, [loadFromDatabase, transactions, accounts]);

  const handleAddCard = () => {
    router.push('/accounts?type=credit&action=create');
  };

  return (
    <div>
      <PageHeader
        title="Credit Cards"
        subtitle="Track your monthly credit card spending"
        actions={
          <Button variant="primary" size="md" onClick={handleAddCard}>
            + Add Credit Card
          </Button>
        }
      />

      <div style={{ padding: 'var(--card-padding)' }} className="page-container">
        {loading ? (
          <Card title="Loading...">
            <p style={{ color: 'var(--text-muted)' }}>Loading your credit card data...</p>
          </Card>
        ) : creditCards.length === 0 ? (
          <Card title="No Credit Cards">
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 'var(--space-3)' }}>
                You haven't created any credit cards yet. Add one to start tracking your monthly spending.
              </p>
              <Button variant="primary" onClick={handleAddCard}>
                + Create Your First Credit Card
              </Button>
            </div>
          </Card>
        ) : (
          <Card title="Credit Card Spending">
            <CreditCardList
              cards={creditCards}
              onClick={(cardId) => router.push(`/credit-cards/${cardId}`)}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
