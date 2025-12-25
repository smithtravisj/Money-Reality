'use client';

import { useState, useEffect } from 'react';
import { SavingsCategory } from '@/types';

interface AllocationItem {
  categoryId: string;
  amount: number;
  isPercentage: boolean;
}

interface IncomeAllocationInputProps {
  income: number;
  savingsCategories: SavingsCategory[];
  onAllocationChange: (allocations: AllocationItem[]) => void;
}

export default function IncomeAllocationInput({
  income,
  savingsCategories,
  onAllocationChange,
}: IncomeAllocationInputProps) {
  const [allocations, setAllocations] = useState<AllocationItem[]>(
    savingsCategories.map((cat) => ({
      categoryId: cat.id,
      amount: 0,
      isPercentage: false,
    }))
  );

  // Calculate total allocated
  const totalAllocated = allocations.reduce((sum, alloc) => {
    if (alloc.amount === 0) return sum;
    const actualAmount = alloc.isPercentage ? (income * alloc.amount) / 100 : alloc.amount;
    return sum + actualAmount;
  }, 0);

  const unallocated = income - totalAllocated;

  // Notify parent of changes
  useEffect(() => {
    onAllocationChange(allocations.filter((a) => a.amount > 0));
  }, [allocations, onAllocationChange]);

  const handleAllocationChange = (categoryId: string, value: number, isPercentage: boolean) => {
    setAllocations((prev) =>
      prev.map((alloc) =>
        alloc.categoryId === categoryId ? { ...alloc, amount: value, isPercentage } : alloc
      )
    );
  };

  const handleTypeToggle = (categoryId: string, isPercentage: boolean) => {
    setAllocations((prev) =>
      prev.map((alloc) =>
        alloc.categoryId === categoryId ? { ...alloc, isPercentage, amount: 0 } : alloc
      )
    );
  };

  const getCategoryName = (categoryId: string) => {
    return savingsCategories.find((c) => c.id === categoryId)?.name || '';
  };


  return (
    <div
      style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--border)',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-control)',
        marginBottom: 'var(--space-3)',
      }}
    >
      <label style={{ fontWeight: '600', color: 'var(--text)', margin: 0, display: 'block', marginBottom: 'var(--space-3)' }}>
        Allocate Income
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Summary Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: 'var(--space-3)',
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: 'var(--panel-2)',
            borderRadius: 'var(--radius-control)',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Allocated
            </div>
            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text)' }}>
              ${totalAllocated.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Remaining
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: '700',
                color: unallocated >= 0 ? 'var(--success)' : 'var(--danger)',
              }}
            >
              ${unallocated.toFixed(2)}
            </div>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'right' }}>
            Total Income<br />
            <span style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--text)' }}>
              ${income.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Allocation Grid */}
        {savingsCategories.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--panel-2)',
              borderRadius: 'var(--radius-control)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Create a savings category first to allocate income
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {allocations.map((alloc) => {
              const allocatedAmount = alloc.isPercentage ? (income * alloc.amount) / 100 : alloc.amount;
              return (
                <div
                  key={alloc.categoryId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    backgroundColor: 'var(--panel-2)',
                    borderRadius: 'var(--radius-control)',
                    borderLeft: allocatedAmount > 0 ? '3px solid var(--accent)' : '3px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--text)', fontSize: 'var(--font-size-sm)' }}>
                      {getCategoryName(alloc.categoryId)}
                    </div>
                  </div>

                  <input
                    type="number"
                    value={alloc.amount || ''}
                    onChange={(e) =>
                      handleAllocationChange(alloc.categoryId, parseFloat(e.target.value) || 0, alloc.isPercentage)
                    }
                    placeholder="0"
                    step={alloc.isPercentage ? '1' : '0.01'}
                    min="0"
                    style={{
                      width: '100px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--panel)',
                      color: 'var(--text)',
                      fontSize: 'var(--font-size-sm)',
                      textAlign: 'right',
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => handleTypeToggle(alloc.categoryId, !alloc.isPercentage)}
                    style={{
                      width: '42px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-control)',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--panel)',
                      color: 'var(--text)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--panel)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text)';
                    }}
                  >
                    {alloc.isPercentage ? '%' : '$'}
                  </button>

                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: allocatedAmount > 0 ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: '500',
                      minWidth: '70px',
                      textAlign: 'right',
                    }}
                  >
                    {allocatedAmount > 0
                      ? alloc.isPercentage
                        ? `${alloc.amount.toFixed(1)}% = $${allocatedAmount.toFixed(2)}`
                        : `$${allocatedAmount.toFixed(2)} = ${((allocatedAmount / income) * 100).toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
