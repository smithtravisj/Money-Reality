'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getAutoPayAccount } from '@/lib/creditCardCalculations';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
];

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  const { accounts, transactions, updateAccount, deleteAccount } = useAppStore();

  const account = accounts.find((a) => a.id === accountId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'checking',
    currentBalance: account?.currentBalance.toString() || '0',
    notes: account?.notes || '',
    autoPayAccountId: account?.autoPayAccountId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const accountTransactions = transactions.filter((t) => t.accountId === accountId);

  // Get checking and savings accounts for auto-pay options (exclude current account)
  const autoPayOptions = [
    { value: '', label: 'None' },
    ...accounts
      .filter((a) => a.id !== accountId && ['checking', 'savings'].includes(a.type))
      .map((a) => ({ value: a.id, label: a.name })),
  ];

  if (!account) {
    return (
      <div>
        <PageHeader title="Account Not Found" />
        <div style={{ padding: 'var(--card-padding)' }} className="page-container">
          <Card>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>This account does not exist.</p>
            <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
              <Button variant="secondary" onClick={() => router.push('/accounts')}>
                Back to Accounts
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const currentBalance = formData.currentBalance ? parseFloat(formData.currentBalance) : 0;
      await updateAccount(accountId, {
        name: formData.name,
        type: formData.type as 'checking' | 'savings' | 'credit' | 'cash',
        currentBalance,
        notes: formData.notes || '',
        autoPayAccountId: formData.autoPayAccountId || null,
      });
      setIsEditing(false);
    } catch (error) {
      setErrors({ submit: 'Failed to update account.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAccount(accountId);
      router.push('/accounts');
    } catch (error) {
      setErrors({ submit: 'Failed to delete account' });
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={account.name}
        subtitle={`${account.type.charAt(0).toUpperCase() + account.type.slice(1)} Account`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => router.push('/accounts')}>
            <ArrowLeft size={16} />
            Back
          </Button>
        }
      />
      <div style={{ padding: 'var(--card-padding)' }} className="page-container">
        {/* Account Overview */}
        <Card title="Account Overview" style={{ marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                Account Type
              </p>
              <p style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--text)' }}>
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                Balance
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '600',
                  color: account.currentBalance < 0 ? 'var(--status-danger)' : 'var(--text)',
                }}
              >
                {account.type === 'credit' && account.currentBalance < 0 ? 'Owed: ' : ''}
                ${Math.abs(account.currentBalance).toFixed(2)}
              </p>
            </div>
          </div>

          {account.type === 'credit' && (
            <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)', marginBottom: 'var(--space-3)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                Auto-Pay Account
              </p>
              <p style={{ color: 'var(--text)', margin: 0 }}>
                {getAutoPayAccount(account, accounts)?.name || <em>Not set</em>}
              </p>
            </div>
          )}

          {account.notes && (
            <div style={{ paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '4px' }}>
                Notes
              </p>
              <p style={{ color: 'var(--text)', margin: 0 }}>{account.notes}</p>
            </div>
          )}
        </Card>

        {/* Edit Form */}
        {showDeleteConfirm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'var(--space-3)',
            }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: 'var(--space-4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 'var(--space-2)' }}>Delete Account?</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                Are you sure you want to delete "{account.name}"? This action cannot be undone.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDelete}
                  loading={loading}
                  style={{ color: 'var(--status-danger)' }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {isEditing ? (
          <Card title="Edit Account" style={{ marginBottom: 'var(--space-4)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Account Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                error={errors.name}
              />

              <Select
                label="Account Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={ACCOUNT_TYPES}
                required
                error={errors.type}
              />

              <Input
                label="Current Balance"
                type="number"
                name="currentBalance"
                value={formData.currentBalance}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
              />

              <Input
                label="Notes (Optional)"
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add notes about this account"
              />

              {formData.type === 'credit' && (
                <Select
                  label="Auto-Pay Account (Optional)"
                  name="autoPayAccountId"
                  value={formData.autoPayAccountId}
                  onChange={handleChange}
                  options={autoPayOptions}
                  helperText="Which account automatically pays this credit card"
                />
              )}

              {errors.submit && (
                <div
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger)',
                    borderRadius: 'var(--radius-control)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {errors.submit}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: account.name,
                      type: account.type,
                      currentBalance: account.currentBalance.toString(),
                      notes: account.notes || '',
                      autoPayAccountId: account.autoPayAccountId || '',
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                Edit Account
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ color: 'var(--status-danger)' }}
              >
                <Trash2 size={16} />
                Delete Account
              </Button>
            </div>
          </Card>
        )}

        {/* Transactions */}
        <Card
          title="Recent Transactions"
          subtitle={`${accountTransactions.length} transaction${accountTransactions.length !== 1 ? 's' : ''}`}
        >
          {accountTransactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              No transactions for this account yet.
            </p>
          ) : (
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
                    <th style={{ padding: 'var(--space-2)', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>
                      Date
                    </th>
                    <th style={{ padding: 'var(--space-2)', textAlign: 'left', fontWeight: '600', color: 'var(--text-muted)' }}>
                      Description
                    </th>
                    <th style={{ padding: 'var(--space-2)', textAlign: 'right', fontWeight: '600', color: 'var(--text-muted)' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountTransactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--text)' }}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--space-2)', color: 'var(--text)' }}>
                        {transaction.merchant || 'Uncategorized'}
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
                    </tr>
                  ))}
                </tbody>
              </table>
              {accountTransactions.length > 10 && (
                <div
                  style={{
                    marginTop: 'var(--space-3)',
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--panel-2)',
                    borderRadius: 'var(--radius-control)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Showing 10 of {accountTransactions.length} transactions
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
