'use client';

import React from 'react';
import { BudgetStatus } from '@/types';
import styles from './BudgetCategoryRow.module.css';

interface BudgetCategoryRowProps {
  status: BudgetStatus;
}

const BudgetCategoryRow: React.FC<BudgetCategoryRowProps> = ({ status }) => {
  // Determine color based on budget status
  const getStatusColor = () => {
    if (status.overspent) return 'var(--status-danger)';
    if (status.percentUsed > 80) return 'var(--status-tight)';
    return 'var(--status-safe)';
  };

  const statusColor = getStatusColor();

  return (
    <div className={styles.row}>
      <div className={styles.categoryInfo}>
        <h4 className={styles.categoryName}>{status.categoryName}</h4>
      </div>

      <div className={styles.budgetInfo}>
        <div className={styles.amounts}>
          <span className={styles.spent}>${status.spent.toFixed(2)}</span>
          <span className={styles.separator}>/</span>
          <span className={styles.budgeted}>${status.budgeted.toFixed(2)}</span>
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min(status.percentUsed, 100)}%`,
                backgroundColor: statusColor,
              }}
            />
          </div>
          <span className={styles.percentage}>{Math.round(status.percentUsed)}%</span>
        </div>
      </div>

      <div className={styles.available}>
        <span style={{ color: status.overspent ? 'var(--status-danger)' : 'var(--text-muted)' }}>
          {status.available >= 0 ? '+' : ''}${status.available.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default BudgetCategoryRow;
