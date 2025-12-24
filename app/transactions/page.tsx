'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Trash2 } from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const { transactions, categories, deleteTransaction } = useAppStore();

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchMerchant, setSearchMerchant] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }

    // Filter by category
    if (filterCategory) {
      result = result.filter((t) => t.categoryId === filterCategory);
    }

    // Filter by merchant/notes search
    if (searchMerchant) {
      const search = searchMerchant.toLowerCase();
      result = result.filter(
        (t) =>
          (t.merchant?.toLowerCase().includes(search) || false) ||
          (t.notes?.toLowerCase().includes(search) || false)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount-asc':
          return a.amount - b.amount;
        case 'amount-desc':
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, filterType, filterCategory, searchMerchant, sortBy]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        alert('Failed to delete transaction');
      }
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div style={{ padding: 'var(--card-padding)' }} className="page-container">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">View and manage all your transactions</p>
      </div>

      {/* Filters Card */}
      <Card title="Filters" style={{ marginBottom: 'var(--space-4)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <Select
            label="Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
            ]}
          />

          <Select
            label="Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
          />

          <Select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            options={[
              { value: 'date-desc', label: 'Newest First' },
              { value: 'date-asc', label: 'Oldest First' },
              { value: 'amount-desc', label: 'Highest Amount' },
              { value: 'amount-asc', label: 'Lowest Amount' },
            ]}
          />

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--text)' }}>
              Search
            </label>
            <input
              type="text"
              value={searchMerchant}
              onChange={(e) => setSearchMerchant(e.target.value)}
              placeholder="Search merchant..."
              style={{
                width: '100%',
                padding: '10px 12px',
                height: 'var(--input-height)',
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
                color: 'var(--text)',
                fontSize: 'var(--font-size-base)',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Try adjusting your filters or add a new transaction"
          action={{ label: 'Add Transaction', onClick: () => router.push('/add-expense') }}
        />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Description</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>Category</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>Amount</th>
                  <th style={{ padding: 'var(--space-2)', textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((transaction) => {
                  const category = categories.find((c) => c.id === transaction.categoryId);
                  return (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--text)' }}>
                        {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--text)' }}>
                        <div>{transaction.merchant || 'Uncategorized'}</div>
                        {transaction.notes && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {transaction.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-2)' }}>
                        {category ? <Badge variant="neutral">{category.name}</Badge> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td
                        style={{
                          padding: 'var(--space-2)',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: transaction.type === 'income' ? 'var(--status-safe)' : 'var(--text)',
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: 'var(--space-2)', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--status-danger)',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all var(--transition-fast)',
                          }}
                          title="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)', backgroundColor: 'var(--panel-2)', borderRadius: 'var(--radius-control)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Showing {filteredAndSorted.length} of {transactions.length} transactions
          </div>
        </Card>
      )}
    </div>
  );
}
