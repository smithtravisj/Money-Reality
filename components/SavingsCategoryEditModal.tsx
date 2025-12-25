'use client';

import { useState } from 'react';
import { SavingsCategory } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { X } from 'lucide-react';

interface SavingsCategoryEditModalProps {
  category: SavingsCategory;
  onClose: () => void;
  onSave: (updates: Partial<SavingsCategory>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function SavingsCategoryEditModal({
  category,
  onClose,
  onSave,
  onDelete,
}: SavingsCategoryEditModalProps) {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description,
    targetAmount: category.targetAmount?.toString() || '',
    currentBalance: category.currentBalance.toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (formData.targetAmount && isNaN(parseFloat(formData.targetAmount))) {
      newErrors.targetAmount = 'Must be a valid number';
    }

    if (isNaN(parseFloat(formData.currentBalance))) {
      newErrors.currentBalance = 'Must be a valid number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim(),
        targetAmount: formData.targetAmount ? parseFloat(formData.targetAmount) : null,
        currentBalance: parseFloat(formData.currentBalance),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      setErrors({ submit: 'Failed to save changes' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this savings category?')) return;

    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete:', error);
      setErrors({ submit: 'Failed to delete category' });
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: '500px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <h3 style={{ color: 'var(--text)', margin: 0 }}>Edit Savings Goal</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            label="Goal Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />

          <Input
            label="Description (Optional)"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What is this savings for?"
          />

          <Input
            label="Target Amount (Optional)"
            type="number"
            step="0.01"
            name="targetAmount"
            value={formData.targetAmount}
            onChange={handleChange}
            placeholder="e.g., 5000.00"
            error={errors.targetAmount}
          />

          <Input
            label="Current Balance"
            type="number"
            step="0.01"
            name="currentBalance"
            value={formData.currentBalance}
            onChange={handleChange}
            error={errors.currentBalance}
          />

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
            <button
              onClick={handleDelete}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-control)',
                border: '1px solid var(--border)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--status-danger)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--status-danger)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
            >
              Delete
            </button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              loading={loading}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
