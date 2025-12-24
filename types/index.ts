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
  categoryId: string | null;
  merchant: string | null;
  paymentMethod: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
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
  createdAt: string;
  updatedAt: string;
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

// Complete app data (for export/import)
export interface AppData {
  transactions: Transaction[];
  categories: Category[];
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
