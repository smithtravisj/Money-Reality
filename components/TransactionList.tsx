'use client';

import { useMemo } from 'react';
import useAppStore from '@/lib/store';
import Card from './ui/Card';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { Trash2 } from 'lucide-react';

interface TransactionListProps {
  limit?: number;
  onDelete?: (id: string) => void;
  showHeader?: boolean;
}

export default function TransactionList({ limit = 10, onDelete, showHeader = true }: TransactionListProps) {
  const { transactions, categories } = useAppStore();

  const sortedTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions, limit]);

  const handleDelete = (id: string) => {
    if (onDelete) {
      if (confirm('Delete this transaction?')) {
        onDelete(id);
      }
    }
  };

  if (sortedTransactions.length === 0) {
    return (
      <Card title={showHeader ? 'Transactions' : undefined}>
        <EmptyState
          title="No transactions"
          description="Start by adding an expense or income to track your finances"
        />
      </Card>
    );
  }

  return (
    <Card title={showHeader ? 'Recent Transactions' : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {sortedTransactions.map((transaction, index) => {
          const category = categories.find((c) => c.id === transaction.categoryId);
          const isLast = index === sortedTransactions.length - 1;

          return (
            <div
              key={transaction.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3)',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500', color: 'var(--text)' }}>
                    {transaction.merchant || 'Uncategorized'}
                  </span>
                  {category && (
                    <Badge variant="neutral">{category.name}</Badge>
                  )}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                  {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {transaction.notes && (
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    {transaction.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div
                  style={{
                    fontWeight: '600',
                    textAlign: 'right',
                    color: transaction.type === 'income' ? 'var(--status-safe)' : 'var(--text)',
                    minWidth: '80px',
                  }}
                >
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </div>

                {onDelete && (
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--status-danger)',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-control)',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all var(--transition-fast)',
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
