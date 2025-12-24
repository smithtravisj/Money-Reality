'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Textarea, Select } from '@/components/ui/Input';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Credit/Debit Card' },
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'Other', label: 'Other' },
];

export default function AddIncomePage() {
  const router = useRouter();
  const { addTransaction, categories, settings } = useAppStore();

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 16), // datetime-local format
    categoryId: '',
    merchant: '',
    paymentMethod: settings.defaultPaymentMethod || 'Transfer',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const incomeCategories = categories.filter((c) => c.type === 'income');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (formData.categoryId && !categories.find((c) => c.id === formData.categoryId)) {
      newErrors.categoryId = 'Invalid category selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, redirect: boolean = true) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await addTransaction({
        type: 'income',
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        categoryId: formData.categoryId || null,
        merchant: formData.merchant || null,
        paymentMethod: formData.paymentMethod || null,
        notes: formData.notes || '',
      });

      // Reset form
      setFormData({
        amount: '',
        date: new Date().toISOString().slice(0, 16),
        categoryId: '',
        merchant: '',
        paymentMethod: settings.defaultPaymentMethod || 'Transfer',
        notes: '',
      });

      if (redirect) {
        router.push('/');
      }
    } catch (error) {
      setErrors({ submit: 'Failed to add income. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 'var(--card-padding)' }} className="page-container-narrow">
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="page-title">Add Income</h1>
        <p className="page-subtitle">Track your earnings</p>
      </div>

      <Card>
        <form onSubmit={(e) => handleSubmit(e, true)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Amount"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            required
            error={errors.amount}
          />

          <Input
            label="Date & Time"
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            error={errors.date}
          />

          <Select
            label="Income Source"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            options={[
              { value: '', label: 'No category' },
              ...incomeCategories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            error={errors.categoryId}
          />

          <Input
            label="Source Description"
            type="text"
            name="merchant"
            value={formData.merchant}
            onChange={handleChange}
            placeholder="e.g., Client Payment, Freelance Work"
          />

          <Select
            label="Payment Method"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            options={PAYMENT_METHODS}
          />

          <Textarea
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Optional notes about this income"
          />

          {errors.submit && (
            <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-control)', fontSize: 'var(--font-size-sm)' }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.push('/')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              Save & Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
