'use client';

import { useState, useEffect } from 'react';
import useAppStore from '@/lib/store';
import { formatCurrency } from '@/lib/formatters';
import PageHeader from '@/components/PageHeader';
import CollapsibleCard from '@/components/CollapsibleCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import BudgetOverview from '@/components/BudgetOverview';
import CategoryEditModal from '@/components/CategoryEditModal';
import SavingsCategoriesList from '@/components/SavingsCategoriesList';
import { Plus } from 'lucide-react';
import styles from './page.module.css';

export default function BudgetPage() {
  const {
    categories,
    accounts,
    updateCategory,
    addCategory,
    loadFromDatabase,
    savingsCategories,
    addSavingsCategory,
    updateSavingsCategory,
    deleteSavingsCategory,
  } = useAppStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', parentGroup: '', monthlyBudget: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Calculate totals
  const totalAccountBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const totalBudgeted = expenseCategories.reduce((sum, category) => sum + (category.monthlyBudget ?? 0), 0);
  const totalSavings = savingsCategories.reduce((sum, category) => sum + category.currentBalance, 0);
  const moneyLeftToAllocate = totalAccountBalance - totalBudgeted - totalSavings;

  // Load categories on mount
  useEffect(() => {
    loadFromDatabase().catch(console.error);
  }, [loadFromDatabase]);

  const handleEditCategory = async (updates: { name: string; parentGroup: string; monthlyBudget: number | null }) => {
    if (!editingCategoryId) return;
    try {
      await updateCategory(editingCategoryId, updates);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  };

  const handleDeleteCategory = async () => {
    if (!editingCategoryId) return;
    try {
      const response = await fetch(`/api/categories/${editingCategoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
      await loadFromDatabase();
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (!formData.parentGroup.trim()) {
      newErrors.parentGroup = 'Group is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setFormLoading(true);
    try {
      const monthlyBudget = formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : null;
      await addCategory({
        name: formData.name,
        type: 'expense',
        parentGroup: formData.parentGroup,
        monthlyBudget,
        colorTag: null,
        icon: null,
        budgetPeriod: 'monthly',
        rolloverBalance: 0,
      });
      setFormData({ name: '', parentGroup: '', monthlyBudget: '' });
      setFormErrors({});
      setShowAddForm(false);
    } catch (error) {
      setFormErrors({ submit: 'Failed to create category' });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <PageHeader
        title="Budget"
        subtitle="Track your monthly spending against your budgets"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowAddForm(true)}
            className={styles.addCategoryButton}
          >
            <Plus size={18} />
            <span className={styles.buttonLabel}>Add Category</span>
          </Button>
        }
      />

      {/* Edit Category Modal */}
      {editingCategoryId && (
        <CategoryEditModal
          category={categories.find((c) => c.id === editingCategoryId)!}
          onClose={() => setEditingCategoryId(null)}
          onSave={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      {/* Add Category Modal */}
      {showAddForm && (
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
          onClick={() => setShowAddForm(false)}
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
              New Category
            </h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Category Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Groceries"
                error={formErrors.name}
              />

              <Input
                label="Group"
                type="text"
                value={formData.parentGroup}
                onChange={(e) => setFormData((prev) => ({ ...prev, parentGroup: e.target.value }))}
                placeholder="e.g., Food"
                error={formErrors.parentGroup}
              />

              <Input
                label="Monthly Budget (Optional)"
                type="number"
                step="0.01"
                value={formData.monthlyBudget}
                onChange={(e) => setFormData((prev) => ({ ...prev, monthlyBudget: e.target.value }))}
                placeholder="e.g., 500.00"
              />

              {formErrors.submit && (
                <div
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--status-danger-bg)',
                    color: 'var(--status-danger)',
                    borderRadius: 'var(--radius-control)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {formErrors.submit}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={formLoading}>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className={styles.pageContainer}>
        <CollapsibleCard cardId="budget-overview" title="Budget Overview">
          <BudgetOverview />
        </CollapsibleCard>

        {/* Set Budgets Section */}
        <CollapsibleCard cardId="set-category-budgets" title="Set Category Budgets" className={styles.collapsibleSection}>
          {/* Allocation Summary */}
          <div className={styles.allocationSummary}>
            <div className={styles.allocationItem}>
              <div className={styles.allocationLabel}>
                Total Balance
              </div>
              <div className={styles.allocationValue}>
                ${formatCurrency(totalAccountBalance)}
              </div>
            </div>
            <div className={styles.allocationItem}>
              <div className={styles.allocationLabel}>
                Budgeted
              </div>
              <div className={styles.allocationValue}>
                ${formatCurrency(totalBudgeted)}
              </div>
            </div>
            <div className={styles.allocationItem}>
              <div className={styles.allocationLabel}>
                Left to Allocate
              </div>
              <div className={styles.allocationValue} style={{ color: moneyLeftToAllocate >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ${formatCurrency(moneyLeftToAllocate)}
              </div>
            </div>
          </div>

          {expenseCategories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
              No expense categories yet. Create some in the Categories page first.
            </p>
          ) : (
            <div className={styles.categoryGroupsContainer}>
              {Array.from(
                new Map(
                  expenseCategories
                    .sort((a, b) => (a.parentGroup || '').localeCompare(b.parentGroup || ''))
                    .map((cat) => [cat.parentGroup || '', cat])
                ).entries()
              ).map(([group, _]) => {
                const categoriesInGroup = expenseCategories.filter((c) => (c.parentGroup || '') === group);
                return (
                  <div key={group} className={styles.categoryGroup}>
                    <h4 className={styles.groupTitle}>
                      {group}
                    </h4>
                    <div className={styles.groupItems}>
                      {categoriesInGroup.map((category) => (
                <div
                  key={category.id}
                  onClick={() => setEditingCategoryId(category.id)}
                  className={styles.categoryItem}
                >
                  <div>
                    <div className={styles.categoryName}>
                      {category.name}
                    </div>
                    <div className={styles.rolloverInfo}>
                      Rollover: ${formatCurrency(category.rolloverBalance ?? 0)}
                    </div>
                  </div>
                  <div className={styles.categoryBudget}>
                    ${formatCurrency(category.monthlyBudget ?? 0)}
                  </div>
                </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleCard>

        {/* Savings Categories Section */}
        <CollapsibleCard cardId="savings" title="Savings Categories" className={styles.collapsibleSection}>
          <SavingsCategoriesList
            categories={savingsCategories}
            unallocatedBudget={moneyLeftToAllocate}
            onAdd={addSavingsCategory}
            onUpdate={updateSavingsCategory}
            onDelete={deleteSavingsCategory}
          />
        </CollapsibleCard>
      </div>
    </div>
  );
}
