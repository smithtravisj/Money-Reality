'use client';

import { useState } from 'react';
import useAppStore from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Edit2, Trash2, Plus } from 'lucide-react';

const PARENT_GROUPS = [
  { value: 'Essentials', label: 'Essentials' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Health', label: 'Health' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Income', label: 'Income' },
];

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAppStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'expense' | 'income',
    parentGroup: 'Essentials' as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

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
      newErrors.name = 'Category name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingId) {
        await updateCategory(editingId, {
          name: formData.name,
          parentGroup: formData.parentGroup,
        });
      } else {
        await addCategory({
          name: formData.name,
          type: formData.type,
          parentGroup: formData.parentGroup,
          colorTag: null,
          icon: null,
        });
      }

      setFormData({ name: '', type: 'expense', parentGroup: 'Essentials' });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      setErrors({ submit: 'Failed to save category' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      type: category.type,
      parentGroup: category.parentGroup,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will not delete transactions in this category.')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        alert('Failed to delete category');
      }
    }
  };

  const renderCategoryGroup = (groupTitle: string, groupCategories: any[]) => {
    if (groupCategories.length === 0) return null;

    return (
      <div key={groupTitle} style={{ marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--text)', marginBottom: 'var(--space-2)' }}>
          {groupTitle}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-2)' }}>
          {groupCategories.map((category) => (
            <div
              key={category.id}
              style={{
                padding: 'var(--space-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--panel-2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text)' }}>{category.name}</div>
                <Badge variant="neutral" style={{ marginTop: '4px' }}>
                  {category.parentGroup}
                </Badge>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => handleEdit(category)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--status-danger)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 'var(--card-padding)' }} className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your transactions</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', type: 'expense', parentGroup: 'Essentials' });
            setShowForm(!showForm);
          }}
        >
          <Plus size={18} /> New Category
        </Button>
      </div>

      {/* Form Card */}
      {showForm && (
        <Card title={editingId ? 'Edit Category' : 'New Category'} style={{ marginBottom: 'var(--space-4)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Input
              label="Category Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Groceries"
              required
              error={errors.name}
            />

            {!editingId && (
              <Select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                ]}
              />
            )}

            <Select
              label="Group"
              name="parentGroup"
              value={formData.parentGroup}
              onChange={handleChange}
              options={PARENT_GROUPS}
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
                size="md"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" loading={loading}>
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Create categories to organize your transactions"
          action={{ label: 'Create Category', onClick: () => setShowForm(true) }}
        />
      ) : (
        <Card>
          <div>
            {renderCategoryGroup('Expense Categories', expenseCategories)}
            {renderCategoryGroup('Income Categories', incomeCategories)}
          </div>
        </Card>
      )}
    </div>
  );
}
