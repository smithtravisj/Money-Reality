'use client';

import { useState, useEffect } from 'react';
import { GiftCard } from '@/types';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface GiftCardFormData {
  name: string;
  initialBalance: string;
  currentBalance: string;
  type: 'digital' | 'physical';
  expirationDate: string;
  notes: string;
}

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [formData, setFormData] = useState<GiftCardFormData>({
    name: '',
    initialBalance: '',
    currentBalance: '',
    type: 'digital',
    expirationDate: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load gift cards
  useEffect(() => {
    loadGiftCards();
  }, []);

  const loadGiftCards = async () => {
    try {
      setPageLoading(true);
      const response = await fetch('/api/gift-cards');
      const data = await response.json();

      if (!response.ok) {
        console.error('Gift cards API error:', data);
        throw new Error(data.error || 'Failed to load gift cards');
      }

      setGiftCards(data.giftCards || []);
    } catch (error) {
      console.error('Failed to load gift cards:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Card name is required';
    }
    if (!formData.initialBalance.trim()) {
      newErrors.initialBalance = 'Initial balance is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/gift-cards/${editingId}` : '/api/gift-cards';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          initialBalance: parseFloat(formData.initialBalance),
          currentBalance: formData.currentBalance ? parseFloat(formData.currentBalance) : parseFloat(formData.initialBalance),
          type: formData.type,
          expirationDate: formData.expirationDate || null,
          notes: formData.notes.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editingId ? 'update' : 'create'} gift card`);
      }

      await loadGiftCards();
      setFormData({
        name: '',
        initialBalance: '',
        currentBalance: '',
        type: 'digital',
        expirationDate: '',
        notes: '',
      });
      setFormErrors({});
      setShowAddForm(false);
      setEditingId(null);
    } catch (error) {
      setFormErrors({ submit: error instanceof Error ? error.message : 'Failed to save gift card' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card: GiftCard) => {
    setEditingId(card.id);
    setFormData({
      name: card.name,
      initialBalance: card.initialBalance.toString(),
      currentBalance: card.currentBalance.toString(),
      type: card.type,
      expirationDate: card.expirationDate ? new Date(card.expirationDate).toISOString().split('T')[0] : '',
      notes: card.notes,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/gift-cards/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete gift card');
      await loadGiftCards();
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete gift card:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = giftCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalSpent = giftCards.reduce((sum, card) => sum + (card.initialBalance - card.currentBalance), 0);

  return (
    <div>
      <PageHeader
        title="Gift Cards"
        subtitle="Track your gift cards and remaining balances"
        actions={
          <Button variant="primary" size="md" onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              initialBalance: '',
              currentBalance: '',
              type: 'digital',
              expirationDate: '',
              notes: '',
            });
            setFormErrors({});
            setShowAddForm(true);
          }}>
            <Plus size={18} /> Add Card
          </Button>
        }
      />

      {/* Add/Edit Card Modal */}
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
              maxWidth: '500px',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--space-4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 'var(--space-3)' }}>
              {editingId ? 'Edit Gift Card' : 'New Gift Card'}
            </h3>
            <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Input
                label="Card Name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Amazon $50"
                error={formErrors.name}
              />

              <Input
                label="Initial Balance"
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) => setFormData((prev) => ({ ...prev, initialBalance: e.target.value }))}
                placeholder="e.g., 50.00"
                error={formErrors.initialBalance}
              />

              <Input
                label="Current Balance"
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData((prev) => ({ ...prev, currentBalance: e.target.value }))}
                placeholder="Leave blank to match initial balance"
              />

              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: 'var(--font-size-sm)', fontWeight: '500', color: 'var(--text)' }}>
                  Type
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'digital' }))}
                    style={{
                      flex: 1,
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-control)',
                      border: formData.type === 'digital' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: formData.type === 'digital' ? 'var(--panel-2)' : 'transparent',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                    }}
                  >
                    Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'physical' }))}
                    style={{
                      flex: 1,
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-control)',
                      border: formData.type === 'physical' ? '2px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: formData.type === 'physical' ? 'var(--panel-2)' : 'transparent',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                    }}
                  >
                    Physical
                  </button>
                </div>
              </div>

              <Input
                label="Expiration Date (Optional)"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
              />

              <Input
                label="Notes (Optional)"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <ConfirmationModal
          title="Delete Gift Card"
          message="Are you sure you want to delete this gift card? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
          isLoading={loading}
        />
      )}

      <div style={{ padding: 'var(--card-padding)' }} className="page-container">
        {/* Summary */}
        {giftCards.length > 0 && (
          <Card style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Total Value
                </div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text)' }}>
                  ${formatCurrency(totalValue)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Total Spent
                </div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text)' }}>
                  ${formatCurrency(totalSpent)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Cards
                </div>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text)' }}>
                  {giftCards.length}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Gift Cards List */}
        {pageLoading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)' }}>
            Loading gift cards...
          </div>
        ) : giftCards.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)' }}>
              <p>No gift cards yet. Click "Add Card" to get started!</p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {giftCards.map((card) => (
              <Card key={card.id}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-4)', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: 'var(--space-2)' }}>
                      {card.name}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                      <span>{card.type === 'digital' ? '🔲 Digital' : '💳 Physical'}</span>
                      {card.expirationDate && (
                        <span>
                          Expires: {new Date(card.expirationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {card.notes && (
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        {card.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Balance
                    </div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text)' }}>
                      ${formatCurrency(card.currentBalance)}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                      of ${formatCurrency(card.initialBalance)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => handleEdit(card)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingId(card.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--status-danger)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
