'use client';

import { useState } from 'react';
import { Category } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface CategoryEditModalProps {
  category: Category;
  onClose: () => void;
  onSave: (updates: { name: string; parentGroup: string; monthlyBudget: number | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function CategoryEditModal({
  category,
  onClose,
  onSave,
  onDelete,
}: CategoryEditModalProps) {
  // If category is undefined (e.g., deleted), close the modal
  if (!category) {
    return null;
  }

  const [name, setName] = useState(category.name);
  const [parentGroup, setParentGroup] = useState(category.parentGroup);
  const [monthlyBudget, setMonthlyBudget] = useState(
    category.monthlyBudget ? category.monthlyBudget.toString() : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (!parentGroup || !parentGroup.trim()) {
      newErrors.parentGroup = 'Group is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const budget = monthlyBudget && monthlyBudget.trim() ? parseFloat(monthlyBudget) : null;
      await onSave({ name, parentGroup: parentGroup || '', monthlyBudget: budget });
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to save category' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to delete category' });
    } finally {
      setDeleting(false);
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
          maxWidth: '400px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: 'var(--space-4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {showDeleteConfirm ? (
          <>
            <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 'var(--space-3)' }}>
              Delete Category?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
              Are you sure you want to delete "{category.name}"? This cannot be undone.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleDelete}
                loading={deleting}
                style={{ backgroundColor: 'var(--status-danger)' }}
              >
                Delete
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 'var(--space-3)' }}>
              Edit Category
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Category Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Groceries"
                error={errors.name}
              />

              <Input
                label="Group"
                type="text"
                value={parentGroup || ''}
                onChange={(e) => setParentGroup(e.target.value)}
                placeholder="e.g., Food"
                error={errors.parentGroup}
              />

              <Input
                label="Monthly Budget"
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="0.00"
                step="0.01"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={saving}>
                  Save
                </Button>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                style={{ width: '100%', color: 'var(--status-danger)' }}
              >
                Delete Category
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
