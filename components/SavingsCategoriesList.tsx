'use client';

import { useState } from 'react';
import { SavingsCategory } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SavingsCategoryEditModal from '@/components/SavingsCategoryEditModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Plus, Trash2 } from 'lucide-react';
import styles from './SavingsCategoriesList.module.css';

interface SavingsCategoriesListProps {
  categories: SavingsCategory[];
  unallocatedBudget: number;
  onAdd: (category: Omit<SavingsCategory, 'id' | 'userId' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate: (id: string, category: Partial<SavingsCategory>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function SavingsCategoriesList({
  categories,
  unallocatedBudget,
  onAdd,
  onUpdate,
  onDelete,
}: SavingsCategoriesListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const targetAmount = formData.targetAmount ? parseFloat(formData.targetAmount) : null;
      await onAdd({
        name: formData.name.trim(),
        description: formData.description.trim(),
        targetAmount,
        currentBalance: 0,
      });
      setFormData({ name: '', description: '', targetAmount: '' });
      setErrors({});
      setShowAddForm(false);
    } catch (error) {
      setErrors({ submit: 'Failed to add savings category' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setLoading(true);
    try {
      await onDelete(id);
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
      setErrors({ submit: 'Failed to delete category' });
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = categories.reduce((sum, cat) => sum + cat.currentBalance, 0);

  return (
    <div>
      {/* Summary */}
      <div style={{
        backgroundColor: 'var(--panel-2)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-control)',
        marginBottom: 'var(--space-4)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gap: 'var(--space-3)',
        alignItems: 'center',
      }} className={styles.summarySection}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>
            Unallocated Budget
          </div>
          <div className={styles.summaryValue} style={{ color: unallocatedBudget >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${unallocatedBudget.toFixed(2)}
          </div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryLabel}>
            Total Saved
          </div>
          <div className={styles.summaryValue}>
            ${totalSavings.toFixed(2)}
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className={styles.addButton}
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div style={{
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
          onClick={() => setShowAddForm(false)}
        >
          <div style={{
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
              New Savings Category
            </h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Category Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Emergency Fund"
                error={errors.name}
              />

              <Input
                label="Description (Optional)"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What is this savings for?"
              />

              <Input
                label="Target Amount (Optional)"
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))}
                placeholder="e.g., 5000.00"
              />

              {errors.submit && (
                <div style={{
                  padding: 'var(--space-2) var(--space-3)',
                  backgroundColor: 'var(--status-danger-bg)',
                  color: 'var(--status-danger)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--font-size-sm)',
                }}>
                  {errors.submit}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <SavingsCategoryEditModal
          category={categories.find((c) => c.id === editingId)!}
          onClose={() => setEditingId(null)}
          onSave={(updates) => onUpdate(editingId, updates)}
          onDelete={() => onDelete(editingId)}
        />
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--space-4) 0',
          color: 'var(--text-muted)',
        }}>
          <p>No savings categories yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }} className={styles.categoriesList}>
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => setEditingId(category.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 'var(--space-3)',
                alignItems: 'center',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--panel-2)',
                borderRadius: 'var(--radius-control)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              className={styles.categoryItem}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--panel-2)';
              }}
            >
              <div>
                <div className={styles.categoryName}>
                  {category.name}
                </div>
                {category.description && (
                  <div className={styles.categoryDescription}>
                    {category.description}
                  </div>
                )}
                {category.targetAmount && (
                  <div className={styles.categoryGoal}>
                    <div className={styles.categoryGoalLabel}>
                      Goal: ${category.targetAmount.toFixed(2)}
                      {category.targetAmount > 0 && (
                        <span> ({((category.currentBalance / category.targetAmount) * 100).toFixed(0)}%)</span>
                      )}
                    </div>
                    {category.targetAmount > 0 && (
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: 'var(--panel)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(2, Math.min((category.currentBalance / category.targetAmount) * 100, 100))}%`,
                            backgroundColor:
                              category.currentBalance >= category.targetAmount
                                ? 'var(--success)'
                                : '#ca8a04',
                            transition: 'width 0.3s ease',
                            minWidth: category.currentBalance > 0 ? '2px' : '0px',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.categoryBalance}>
                <div className={styles.categoryBalanceAmount}>
                  ${category.currentBalance.toFixed(2)}
                </div>
              </div>

              <div className={styles.categoryActions}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingId(category.id);
                  }}
                  className={styles.deleteButton}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--status-danger)',
                    padding: '4px',
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <ConfirmationModal
          title="Delete Savings Category"
          message={`Are you sure you want to delete "${categories.find((c) => c.id === deletingId)?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={() => handleDeleteCategory(deletingId)}
          onCancel={() => setDeletingId(null)}
          isLoading={loading}
        />
      )}
    </div>
  );
}
