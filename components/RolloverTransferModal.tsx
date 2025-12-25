'use client';

import { useState } from 'react';
import { Category } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface RolloverTransferModalProps {
  categories: Category[];
  onClose: () => void;
  onTransfer: (fromCategoryId: string, toCategoryId: string, amount: number) => Promise<void>;
}

export default function RolloverTransferModal({
  categories,
  onClose,
  onTransfer,
}: RolloverTransferModalProps) {
  // Filter to only expense categories with rollover balance
  const categoriesWithRollover = categories.filter(
    (c) => c.type === 'expense' && (c.rolloverBalance || 0) > 0
  );

  // All expense categories can receive transfers
  const allExpenseCategories = categories.filter((c) => c.type === 'expense');

  const [fromCategoryId, setFromCategoryId] = useState<string>(
    categoriesWithRollover.length > 0 ? categoriesWithRollover[0].id : ''
  );
  const [toCategoryId, setToCategoryId] = useState<string>(
    allExpenseCategories.length > 0 ? allExpenseCategories[0].id : ''
  );
  const [amount, setAmount] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [transferring, setTransferring] = useState(false);

  const selectedFromCategory = categories.find((c) => c.id === fromCategoryId);
  const maxAmount = (selectedFromCategory?.rolloverBalance || 0);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fromCategoryId) {
      newErrors.fromCategory = 'Source category is required';
    }
    if (!toCategoryId) {
      newErrors.toCategory = 'Destination category is required';
    }
    if (fromCategoryId === toCategoryId) {
      newErrors.amount = 'Source and destination must be different';
    }

    if (!amount || amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (numAmount > maxAmount) {
        newErrors.amount = `Amount cannot exceed available rollover ($${maxAmount.toFixed(2)})`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setTransferring(true);
    try {
      await onTransfer(fromCategoryId, toCategoryId, parseFloat(amount));
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to transfer rollover' });
    } finally {
      setTransferring(false);
    }
  };

  if (categoriesWithRollover.length === 0) {
    return (
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
        onClick={onClose}
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
          <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 'var(--space-3)' }}>
            No Rollover Available
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            You don't have any rollover balance to transfer. Rollover balance accumulates when you
            don't spend your full monthly budget.
          </p>
          <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
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
      onClick={onClose}
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
        <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 'var(--space-3)' }}>
          Transfer Rollover
        </h3>
        <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              From Category
            </label>
            <select
              value={fromCategoryId}
              onChange={(e) => {
                setFromCategoryId(e.target.value);
                setErrors({});
              }}
              disabled={transferring}
              style={{
                width: '100%',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--input)',
                color: 'var(--text)',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'inherit',
              }}
            >
              {categoriesWithRollover.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} (Rollover: ${(cat.rolloverBalance || 0).toFixed(2)})
                </option>
              ))}
            </select>
            {errors.fromCategory && (
              <div style={{ color: 'var(--status-danger)', fontSize: 'var(--font-size-2xs)', marginTop: 'var(--space-1)' }}>
                {errors.fromCategory}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              To Category
            </label>
            <select
              value={toCategoryId}
              onChange={(e) => {
                setToCategoryId(e.target.value);
                setErrors({});
              }}
              disabled={transferring}
              style={{
                width: '100%',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--input)',
                color: 'var(--text)',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'inherit',
              }}
            >
              {allExpenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.toCategory && (
              <div style={{ color: 'var(--status-danger)', fontSize: 'var(--font-size-2xs)', marginTop: 'var(--space-1)' }}>
                {errors.toCategory}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--text)', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
              Amount
            </label>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
              Max: ${maxAmount.toFixed(2)}
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors({});
              }}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={maxAmount}
              disabled={transferring}
              error={errors.amount}
            />
          </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={transferring}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={transferring}>
              Transfer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
