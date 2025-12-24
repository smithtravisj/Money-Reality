'use client';

import { useState, useMemo } from 'react';
import useAppStore from '@/lib/store';
import { calculateBalance } from '@/lib/balanceCalculations';
import { AlertTriangle, X } from 'lucide-react';

export default function WarningBanner() {
  const { transactions, settings } = useAppStore();
  const [dismissed, setDismissed] = useState(false);

  const shouldShow = useMemo(() => {
    if (!settings.enableWarnings || dismissed) {
      return false;
    }

    const balance = calculateBalance(transactions);
    const threshold = settings.warningThreshold ?? 0;

    return balance < threshold;
  }, [transactions, settings, dismissed]);

  if (!shouldShow) {
    return null;
  }

  const balance = calculateBalance(transactions);

  return (
    <div
      style={{
        padding: 'var(--space-3)',
        backgroundColor: 'var(--status-danger-bg)',
        border: `1px solid var(--status-danger)`,
        borderRadius: 'var(--radius-control)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
        position: 'relative',
      }}
    >
      <AlertTriangle size={20} style={{ color: 'var(--status-danger)', flexShrink: 0 }} />

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', color: 'var(--status-danger)' }}>
          Critical Warning
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Your balance (${balance.toFixed(2)}) is below your warning threshold of ${(settings.warningThreshold ?? 0).toFixed(2)}. Consider reducing expenses or adding income.
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--status-danger)',
          cursor: 'pointer',
          padding: '4px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
        title="Dismiss"
      >
        <X size={20} />
      </button>
    </div>
  );
}
