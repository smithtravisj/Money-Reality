'use client';

import { useState, useMemo } from 'react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import AddTransactionModal from '@/components/AddTransactionModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import Button from '@/components/ui/Button';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './page.module.css';

export default function TransactionsPage() {
  const { transactions, categories, accounts, deleteTransaction } = useAppStore();

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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

    // Comprehensive search across all fields
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      result = result.filter((t) => {
        // Search merchant
        if (t.merchant?.toLowerCase().includes(search)) return true;

        // Search notes
        if (t.notes?.toLowerCase().includes(search)) return true;

        // Search category name
        const category = categories.find((c) => c.id === t.categoryId);
        if (category?.name.toLowerCase().includes(search)) return true;

        // Search amount
        if (t.amount.toString().includes(search)) return true;

        // Search date (multiple formats)
        const dateStr = new Date(t.date);
        const dateFormatted = dateStr.toLocaleDateString();
        const dateISO = dateStr.toISOString().split('T')[0];
        if (dateFormatted.includes(search) || dateISO.includes(search)) return true;

        // Search payment method
        if (t.paymentMethod?.toLowerCase().includes(search)) return true;

        // Search account name
        const account = accounts.find((a) => a.id === t.accountId);
        if (account?.name.toLowerCase().includes(search)) return true;

        // Search transaction type
        if (t.type.toLowerCase().includes(search)) return true;

        return false;
      });
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
  }, [transactions, filterType, filterCategory, searchQuery, sortBy]);

  const handleDeleteTransaction = async (id: string) => {
    setLoading(true);
    try {
      await deleteTransaction(id);
      setDeletingTransactionId(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="View and manage all your transactions"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }} className={styles.headerActions}>
            <div className={styles.filterButtonGroup} style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--panel-2)', padding: '4px', borderRadius: 'var(--radius-control)' }}>
              <button
                onClick={() => setFilterType('expense')}
                className={`${styles.filterButton} ${filterType === 'expense' ? styles.active : ''}`}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-control)',
                  border: filterType === 'expense' ? '2px solid var(--accent)' : '1px solid transparent',
                  backgroundColor: filterType === 'expense' ? 'var(--panel)' : 'transparent',
                  color: filterType === 'expense' ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
              >
                Expenses
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`${styles.filterButton} ${filterType === 'income' ? styles.active : ''}`}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-control)',
                  border: filterType === 'income' ? '2px solid var(--accent)' : '1px solid transparent',
                  backgroundColor: filterType === 'income' ? 'var(--panel)' : 'transparent',
                  color: filterType === 'income' ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
              >
                Income
              </button>
              <button
                onClick={() => setFilterType('all')}
                className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-control)',
                  border: filterType === 'all' ? '2px solid var(--accent)' : '1px solid transparent',
                  backgroundColor: filterType === 'all' ? 'var(--panel)' : 'transparent',
                  color: filterType === 'all' ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
              >
                All
              </button>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setExpenseModalOpen(true)}
            >
              <Plus size={18} /> Expense
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIncomeModalOpen(true)}
            >
              <Plus size={18} /> Income
            </Button>
          </div>
        }
      />
      <div className={styles.pageContainer}>

      {/* Filters Card */}
      <Card title="Filters" className={`${styles.filterCard} ${!isFiltersOpen ? styles.collapsed : ''}`} action={
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--text)', display: 'none' }}
          className={styles.toggleButton}
        >
          {isFiltersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      }>
        <div className={`${styles.filterGrid} ${isFiltersOpen ? styles.open : ''}`}>
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

          <div style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--text)' }}>
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
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
          action={{ label: 'Add Transaction', onClick: () => setExpenseModalOpen(true) }}
        />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.transactionsTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.tableHeaderCell}>Date</th>
                  <th className={styles.tableHeaderCell}>Description</th>
                  <th className={styles.tableHeaderCell}>Category</th>
                  <th className={`${styles.tableHeaderCell} ${styles.right}`}>Amount</th>
                  <th className={`${styles.tableHeaderCell} ${styles.center}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((transaction) => {
                  const category = categories.find((c) => c.id === transaction.categoryId);
                  return (
                    <tr key={transaction.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.transactionMerchant}>{transaction.merchant || 'Uncategorized'}</div>
                        {transaction.notes && (
                          <div className={styles.transactionNotes}>
                            {transaction.notes}
                          </div>
                        )}
                      </td>
                      <td className={styles.tableCell}>
                        {category ? <Badge variant="neutral">{category.name}</Badge> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className={`${styles.tableCell} ${styles.right}`}>
                        <span className={`${styles.transactionAmount} ${transaction.type === 'income' ? styles.income : ''}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.center}`}>
                        <button
                          onClick={() => setDeletingTransactionId(transaction.id)}
                          className={styles.deleteButton}
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
          <div className={styles.transactionCount}>
            Showing {filteredAndSorted.length} of {transactions.length} transactions
          </div>
        </Card>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTransactionId && (
        <ConfirmationModal
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={() => handleDeleteTransaction(deletingTransactionId)}
          onCancel={() => setDeletingTransactionId(null)}
          isLoading={loading}
        />
      )}

      {/* Transaction Modals */}
      <AddTransactionModal
        type="expense"
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />
      <AddTransactionModal
        type="income"
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
      />
    </div>
  );
}
