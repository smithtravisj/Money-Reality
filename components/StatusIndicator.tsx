'use client';

import { useMemo } from 'react';
import useAppStore from '@/lib/store';
import { calculateBalance, determineFinancialStatus } from '@/lib/balanceCalculations';

interface StatusIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StatusIndicator({ size = 'md', showLabel = true }: StatusIndicatorProps) {
  const { transactions, settings } = useAppStore();

  const { status, color } = useMemo(() => {
    const balance = calculateBalance(transactions);
    const financialStatus = determineFinancialStatus(
      balance,
      settings.safeThreshold,
      settings.tightThreshold
    );

    const statusMap = {
      safe: { label: 'Safe', color: 'var(--status-safe)' },
      tight: { label: 'Tight', color: 'var(--status-tight)' },
      danger: { label: 'Danger', color: 'var(--status-danger)' },
    };

    return {
      status: statusMap[financialStatus.status as keyof typeof statusMap],
      color: statusMap[financialStatus.status as keyof typeof statusMap].color,
    };
  }, [transactions, settings]);

  const sizeMap = {
    sm: { dot: '8px', fontSize: 'var(--font-size-xs)' },
    md: { dot: '12px', fontSize: 'var(--font-size-sm)' },
    lg: { dot: '16px', fontSize: 'var(--font-size-base)' },
  };

  const currentSize = sizeMap[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: currentSize.dot,
          height: currentSize.dot,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}40`,
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span style={{ fontSize: currentSize.fontSize, fontWeight: '500', color }}>
          {status.label}
        </span>
      )}
    </div>
  );
}
