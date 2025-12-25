'use client';

import { useState, useEffect } from 'react';
import useAppStore from '@/lib/store';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import AccountList from '@/components/AccountList';

const ACCOUNT_TYPES = [
  { value: 'checking', label: 'Checking Account' },
  { value: 'savings', label: 'Savings Account' },
  { value: 'credit', label: 'Credit Card' },
  { value: 'cash', label: 'Cash' },
];

export default function AccountsPage() {
  const { loadFromDatabase, accounts } = useAppStore();
  const [showForm, setShowForm] = useState(false);

  // Load accounts from database on mount
  useEffect(() => {
    loadFromDatabase().catch(console.error);
  }, [loadFromDatabase]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking',
    currentBalance: '',
    notes: '',
    autoPayAccountId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
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
      // Manually call the API to get better error handling
      const currentBalance = formData.currentBalance ? parseFloat(formData.currentBalance) : 0;
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          currentBalance,
          notes: formData.notes || '',
          autoPayAccountId: formData.autoPayAccountId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to create account' });
        return;
      }

      const { account } = await response.json();

      // Update store manually
      const { accounts: storeAccounts } = useAppStore.getState();
      useAppStore.setState({ accounts: [...storeAccounts, account] });

      // Reset form
      setFormData({
        name: '',
        type: 'checking',
        currentBalance: '',
        notes: '',
        autoPayAccountId: '',
      });
      setShowForm(false);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Get checking and savings accounts for auto-pay options
  const autoPayOptions = [
    { value: '', label: 'None' },
    ...accounts
      .filter((a) => ['checking', 'savings'].includes(a.type))
      .map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <div>
      <PageHeader
        title="Accounts"
        subtitle="Manage your accounts"
        actions={
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Account'}
          </Button>
        }
      />
      <div style={{ padding: 'var(--card-padding)' }} className="page-container">
        {/* Account Creation Form */}
        {showForm && (
          <Card title="Create New Account" style={{ marginBottom: 'var(--space-4)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Account Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., My Checking Account"
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
                label="Starting Balance (Optional)"
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
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Create Account
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Accounts List */}
        <AccountList />
      </div>
    </div>
  );
}
