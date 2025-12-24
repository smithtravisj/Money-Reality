'use client';

import { useMemo } from 'react';
import useAppStore from '@/lib/store';
import Card from './ui/Card';
import { calculateBalance } from '@/lib/balanceCalculations';
import { getAllPredictiveInsights } from '@/lib/predictions';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';

export default function PredictiveInsights() {
  const { transactions } = useAppStore();

  const insights = useMemo(() => {
    const balance = calculateBalance(transactions);
    return getAllPredictiveInsights(balance, transactions);
  }, [transactions]);

  if (insights.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} />;
      case 'warning':
        return <TrendingUp size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'var(--status-danger)';
      case 'warning':
        return 'var(--status-tight)';
      default:
        return 'var(--accent)';
    }
  };

  return (
    <Card title="Financial Insights">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {insights.map((insight, index) => (
          <div
            key={index}
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-control)',
              backgroundColor: `var(--status-${insight.severity}-bg)`,
              borderLeft: `3px solid var(--status-${insight.severity})`,
              display: 'flex',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ color: getSeverityColor(insight.severity), flexShrink: 0, marginTop: '2px' }}>
              {getSeverityIcon(insight.severity)}
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: '600',
                  color: `var(--status-${insight.severity})`,
                  marginBottom: '4px',
                }}
              >
                {insight.title}
              </div>

              <p style={{ margin: '0 0 4px 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                {insight.message}
              </p>

              <div
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: '700',
                  color: `var(--status-${insight.severity})`,
                }}
              >
                {insight.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
