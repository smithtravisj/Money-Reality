'use client';

import React, { useState } from 'react';
import useAppStore from '@/lib/store';
import Button from '@/components/ui/Button';
import Input, { Select, Textarea } from '@/components/ui/Input';
import AccountSelector from '@/components/AccountSelector';
import IncomeAllocationInput from '@/components/IncomeAllocationInput';
import styles from './AddTransactionModal.module.css';

interface AddTransactionModalProps {
  type: 'expense' | 'income';
  isOpen: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Credit/Debit Card' },
  { value: 'Transfer', label: 'Bank Transfer' },
  { value: 'Other', label: 'Other' },
];

interface AllocationItem {
  categoryId: string;
  amount: number;
  isPercentage: boolean;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ type, isOpen, onClose }) => {
  const { addTransaction, categories, settings, getDefaultAccount, savingsCategories } = useAppStore();
  const defaultAccount = getDefaultAccount();

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 16),
    categoryId: '',
    accountId: defaultAccount?.id || '',
    merchant: '',
    paymentMethod: settings.defaultPaymentMethod || 'Card',
    notes: '',
  });

  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const relevantCategories = categories.filter((c) => c.type === type);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await addTransaction({
        type,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        categoryId: formData.categoryId || null,
        accountId: formData.accountId,
        merchant: formData.merchant || null,
        paymentMethod: formData.paymentMethod || null,
        notes: formData.notes || '',
        allocations: type === 'income' ? allocations : undefined,
      });

      // Reset form and close
      setFormData({
        amount: '',
        date: new Date().toISOString().slice(0, 16),
        categoryId: '',
        accountId: defaultAccount?.id || '',
        merchant: '',
        paymentMethod: settings.defaultPaymentMethod || 'Card',
        notes: '',
      });
      setAllocations([]);
      onClose();
    } catch (error) {
      setErrors({ submit: `Failed to add ${type}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = type === 'expense' ? 'Add Expense' : 'Add Income';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
            label="Date"
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            error={errors.date}
          />

          <AccountSelector
            value={formData.accountId}
            onChange={(accountId) => setFormData((prev) => ({ ...prev, accountId }))}
            error={errors.accountId}
          />

          {relevantCategories.length > 0 && (
            <Select
              label="Category (Optional)"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              options={[
                { value: '', label: 'None' },
                ...relevantCategories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
            />
          )}

          {type === 'income' && (
            <IncomeAllocationInput
              income={parseFloat(formData.amount) || 0}
              savingsCategories={savingsCategories}
              onAllocationChange={setAllocations}
            />
          )}

          <Input
            label="Merchant/Description (Optional)"
            type="text"
            name="merchant"
            value={formData.merchant}
            onChange={handleChange}
            placeholder={type === 'income' ? 'e.g., Salary, Freelance work' : 'e.g., Whole Foods'}
          />

          {type === 'expense' && (
            <Select
              label="Payment Method (Optional)"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              options={PAYMENT_METHODS}
            />
          )}

          <Textarea
            label="Notes (Optional)"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes..."
          />

          {errors.submit && (
            <div className={styles.error}>
              {errors.submit}
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {title}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
