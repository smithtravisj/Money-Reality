// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  date: string;
  accountId: string;
  categoryId: string | null;
  merchant: string | null;
  paymentMethod: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  account?: Account;
}

// Account types
export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currentBalance: number;
  notes: string;
  colorTag: string | null;
  icon: string | null;
  order: number;
  isDefault: boolean;
  autoPayAccountId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'expense' | 'income';
  parentGroup: string | null;
  colorTag: string | null;
  icon: string | null;
  order: number;
  monthlyBudget: number | null;
  budgetPeriod: string;
  rolloverBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRolloverUpdate {
  categoryId: string;
  categoryName: string;
  unspent: number;
  newRolloverBalance: number;
}

export interface RolloverSummary {
  month: string;
  totalRolledOver: number;
  categoryUpdates: CategoryRolloverUpdate[];
  categoriesProcessed: number;
}

// Weekly check-in types
export interface WeeklyCheckin {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  startingBalance: number;
  endingBalance: number;
  reflectionNotes: string;
  createdAt: string;
  updatedAt: string;
}

// Balance snapshot types
export interface BalanceSnapshot {
  id: string;
  userId: string;
  balance: number;
  status: 'safe' | 'tight' | 'danger';
  timestamp: string;
}

// Settings types
export interface Settings {
  theme: 'dark' | 'light';
  currency: string;
  safeThreshold: number | null;
  tightThreshold: number | null;
  enableWarnings: boolean;
  warningThreshold: number | null;
  defaultPaymentMethod: string | null;
  defaultAccountId: string | null;
  totalSavings?: number;
  cardCollapseStates?: string; // JSON string with card collapse states
}

// Savings Category types
export interface SavingsCategory {
  id: string;
  userId: string;
  name: string;
  description: string;
  targetAmount: number | null;
  currentBalance: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Financial status types
export interface FinancialStatus {
  balance: number;
  status: 'safe' | 'tight' | 'danger';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

// Predictive insight types
export interface PredictiveInsight {
  type: 'runway' | 'end_of_month' | 'accelerating_spending';
  title: string;
  message: string;
  value: number | string;
  severity: 'info' | 'warning' | 'critical';
}

// Spending breakdown types
export interface SpendingCategory {
  categoryName: string;
  categoryId: string | null;
  amount: number;
  percentage: number;
  color?: string;
}

// Budget types
export interface BudgetStatus {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  available: number;
  rollover: number;
  totalAvailable: number;
  percentUsed: number;
  overspent: boolean;
}

export interface BudgetSummary {
  month: string;
  totalBudgeted: number;
  totalSpent: number;
  totalAvailable: number;
  categories: BudgetStatus[];
  overallPercentUsed: number;
  categoriesOverBudget: number;
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  transactionCount: number;
  displayBalance: string;
}

// Credit card types
export interface CreditCardMonthlySpending {
  month: string; // 'YYYY-MM'
  year: number;
  monthNum: number;
  monthName: string; // 'December'
  spent: number;
  transactionCount: number;
  isCurrentMonth: boolean;
}

export interface CreditCardSummary {
  cardId: string;
  cardName: string;
  currentBalance: number;
  currentMonthSpending: number;
  currentMonthTransactionCount: number;
  autoPayAccount: {
    id: string;
    name: string;
    type: AccountType;
  } | null;
}

export interface CreditCardSpendingHistoryResponse {
  cardId: string;
  cardName: string;
  currentMonth: CreditCardMonthlySpending;
  history: CreditCardMonthlySpending[];
  autoPayAccount: {
    id: string;
    name: string;
    type: AccountType;
  } | null;
}

// Complete app data (for export/import)
export interface AppData {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  weeklyCheckins: WeeklyCheckin[];
  balanceSnapshots: BalanceSnapshot[];
  settings: Settings;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface WeeklyCheckinsResponse {
  checkins: WeeklyCheckin[];
}

export interface SettingsResponse {
  settings: Settings;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface AccountResponse {
  account: Account;
}

// Component props types
export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}
