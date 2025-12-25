'use client';

import { CreditCardSummary } from '@/types';
import { ChevronRight } from 'lucide-react';

interface CreditCardListProps {
  cards: CreditCardSummary[];
  onClick?: (cardId: string) => void;
}

export default function CreditCardList({ cards, onClick }: CreditCardListProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {cards.map((card) => (
        <div
          key={card.cardId}
          onClick={() => onClick?.(card.cardId)}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 'var(--space-3)',
            alignItems: 'center',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--panel-2)',
            borderRadius: 'var(--radius-control)',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (onClick) {
              e.currentTarget.style.backgroundColor = 'var(--panel)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--panel-2)';
          }}
        >
          <div>
            <div style={{ fontWeight: '500', color: 'var(--text)', marginBottom: '4px' }}>
              {card.cardName}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Spent this month: <strong style={{ color: 'var(--text)' }}>${card.currentMonthSpending.toFixed(2)}</strong>
            </div>
            {card.autoPayAccount ? (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Auto-pay: {card.autoPayAccount.name}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Auto-pay: <em>Not set</em>
              </div>
            )}
          </div>
          {onClick && (
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
              <ChevronRight size={20} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
