'use client';

import React, { useState, useMemo } from 'react';
import useAppStore from '@/lib/store';
import { calculateBudgetSummary } from '@/lib/balanceCalculations';
import Card from '@/components/ui/Card';
import BudgetCategoryRow from '@/components/BudgetCategoryRow';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './BudgetOverview.module.css';

interface BudgetOverviewProps {
  month?: string;
  onMonthChange?: (month: string) => void;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ onMonthChange }) => {
  const { transactions, categories } = useAppStore();

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Track if user has navigated away from current month
  const currentMonthValue = getCurrentMonth();
  const [userSelectedMonth, setUserSelectedMonth] = useState<string | null>(null);

  // Use user-selected month if they navigated, otherwise always use current month
  const currentMonth = userSelectedMonth || currentMonthValue;

  console.log('[BudgetOverview] Current month value:', currentMonthValue, 'User selected:', userSelectedMonth, 'Using:', currentMonth);

  const budgetSummary = useMemo(() => {
    return calculateBudgetSummary(categories, transactions, currentMonth);
  }, [transactions, categories, currentMonth]);

  const handlePreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;

    if (newMonth === 0) {
      newMonth = 12;
      newYear -= 1;
    }

    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setUserSelectedMonth(newMonthStr);
    onMonthChange?.(newMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;

    if (newMonth === 13) {
      newMonth = 1;
      newYear += 1;
    }

    const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    setUserSelectedMonth(newMonthStr);
    onMonthChange?.(newMonthStr);
  };

  const getStatusColor = () => {
    if (budgetSummary.categoriesOverBudget > 0) return 'var(--status-danger)';
    if (budgetSummary.overallPercentUsed > 80) return 'var(--status-tight)';
    return 'var(--status-safe)';
  };

  // Parse month safely to avoid timezone issues
  const [monthYear, monthNum] = currentMonth.split('-').map(Number);
  const monthDate = new Date(monthYear, monthNum - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  console.log('[BudgetOverview] monthName calculation:', currentMonth, '->', monthName);

  if (budgetSummary.categories.length === 0) {
    return (
      <Card title="Budget" subtitle="No budgets set">
        <p className={styles.empty}>
          Set monthly budgets for your categories to track spending
        </p>
      </Card>
    );
  }

  return (
    <Card title="Budget">
      <div className={styles.monthNavigator}>
        <button className={styles.navButton} onClick={handlePreviousMonth} title="Previous month">
          <ChevronLeft size={20} />
        </button>
        <h3 className={styles.monthDisplay}>{monthName}</h3>
        <button className={styles.navButton} onClick={handleNextMonth} title="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.summaryStats}>
        <div className={styles.statItem}>
          <p className={styles.statLabel}>Total Budgeted</p>
          <p className={styles.statValue}>${budgetSummary.totalBudgeted.toFixed(2)}</p>
        </div>

        <div className={styles.statItem}>
          <p className={styles.statLabel}>Total Spent</p>
          <p className={styles.statValue}>${budgetSummary.totalSpent.toFixed(2)}</p>
        </div>

        <div className={styles.statItem}>
          <p className={styles.statLabel}>Remaining</p>
          <p
            className={styles.statValue}
            style={{
              color:
                budgetSummary.totalAvailable >= 0
                  ? 'var(--status-safe)'
                  : 'var(--status-danger)',
            }}
          >
            ${budgetSummary.totalAvailable.toFixed(2)}
          </p>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Overall Budget Usage</span>
          <span className={styles.progressPercent}>
            {Math.round(budgetSummary.overallPercentUsed)}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${Math.min(budgetSummary.overallPercentUsed, 100)}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>
        {budgetSummary.categoriesOverBudget > 0 && (
          <p className={styles.warning}>
            {budgetSummary.categoriesOverBudget} category
            {budgetSummary.categoriesOverBudget !== 1 ? 'ies' : ''} over budget
          </p>
        )}
      </div>

      <div className={styles.categoriesSection}>
        <h4 className={styles.categoriesTitle}>Categories</h4>
        <div className={styles.categoriesList}>
          {budgetSummary.categories.map((status) => (
            <BudgetCategoryRow key={status.categoryId} status={status} />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default BudgetOverview;
