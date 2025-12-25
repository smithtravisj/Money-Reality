'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Category, WeeklyCheckin, Settings, AppData, Account, CreditCardMonthlySpending, CreditCardSummary, SavingsCategory } from '@/types';
import { getCreditCardSpendingHistory, getCreditCardsSummary } from '@/lib/creditCardCalculations';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  currency: 'USD',
  safeThreshold: null,
  tightThreshold: null,
  enableWarnings: true,
  warningThreshold: null,
  defaultPaymentMethod: null,
  defaultAccountId: null,
  totalSavings: 0,
  cardCollapseStates: '{}',
};

interface AppStore {
  // Data
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  weeklyCheckins: WeeklyCheckin[];
  savingsCategories: SavingsCategory[];
  settings: Settings;
  loading: boolean;
  userId: string | null;
  error: string | null;

  // Initialization
  initializeStore: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  setUserId: (userId: string) => void;
  setError: (error: string | null) => void;

  // Transactions CRUD
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { allocations?: Array<{ categoryId: string; amount: number; isPercentage: boolean }> }) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];

  // Categories CRUD
  addCategory: (category: Omit<Category, 'id' | 'userId' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategories: (type: 'expense' | 'income' | 'all') => Category[];

  // Accounts CRUD
  addAccount: (account: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccounts: () => Account[];
  getDefaultAccount: () => Account | undefined;
  getTransactionsByAccount: (accountId: string) => Transaction[];

  // Credit Cards
  getCreditCards: () => CreditCardSummary[];
  getCreditCardCurrentMonthSpending: (cardId: string) => number;
  getCreditCardSpendingHistory: (cardId: string, monthsBack?: number) => CreditCardMonthlySpending[];

  // Weekly Check-ins CRUD
  addWeeklyCheckin: (checkin: Omit<WeeklyCheckin, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWeeklyCheckin: (id: string, checkin: Partial<WeeklyCheckin>) => Promise<void>;
  getWeeklyCheckins: () => WeeklyCheckin[];

  // Savings Categories CRUD
  addSavingsCategory: (category: Omit<SavingsCategory, 'id' | 'userId' | 'order' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSavingsCategory: (id: string, category: Partial<SavingsCategory>) => Promise<void>;
  deleteSavingsCategory: (id: string) => Promise<void>;
  getSavingsCategories: () => SavingsCategory[];

  // Settings
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  toggleCardCollapse: (cardId: string) => Promise<void>;
  isCardCollapsed: (cardId: string) => boolean;

  // Import/Export
  exportData: () => Promise<AppData>;
}

// localStorage helper functions
const CACHE_KEY = 'money-reality-cache';

const saveToLocalStorage = (state: any) => {
  try {
    const cacheData = {
      transactions: state.transactions,
      categories: state.categories,
      accounts: state.accounts,
      weeklyCheckins: state.weeklyCheckins,
      savingsCategories: state.savingsCategories,
      settings: state.settings,
      lastSync: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
  return null;
};

let syncInterval: NodeJS.Timeout | null = null;


const useAppStore = create<AppStore>((set, get) => ({
  transactions: [],
  categories: [],
  accounts: [],
  weeklyCheckins: [],
  savingsCategories: [],
  settings: DEFAULT_SETTINGS,
  loading: false,
  userId: null,
  error: null,

  setUserId: (userId: string) => {
    set({ userId });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  initializeStore: async () => {
    set({ loading: true, error: null });

    // Load from localStorage immediately
    const cached = loadFromLocalStorage();
    if (cached) {
      set({
        transactions: cached.transactions || [],
        categories: cached.categories || [],
        accounts: cached.accounts || [],
        weeklyCheckins: cached.weeklyCheckins || [],
        savingsCategories: cached.savingsCategories || [],
        settings: cached.settings || DEFAULT_SETTINGS,
      });
    }

    try {
      // Check if monthly rollover is needed
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastRollover = localStorage.getItem('lastMonthlyRollover');

      if (!lastRollover || lastRollover !== currentMonth) {
        try {
          const rolloverRes = await fetch('/api/monthly-rollover', { method: 'POST' });
          if (rolloverRes.ok) {
            localStorage.setItem('lastMonthlyRollover', currentMonth);
            console.log('Monthly rollover processed successfully');
          } else {
            console.warn('Monthly rollover API returned error:', rolloverRes.status);
          }
        } catch (error) {
          console.warn('Monthly rollover check failed (non-blocking):', error);
          // Don't block initialization if rollover fails
        }
      }

      // Fetch fresh data in background
      await get().loadFromDatabase();
    } catch (error) {
      console.error('Failed to initialize store:', error);
      if (!cached) {
        set({ error: 'Failed to load data' });
      }
    } finally {
      set({ loading: false });
    }

    // Start background sync every 5 seconds
    if (!syncInterval) {
      syncInterval = setInterval(async () => {
        try {
          await get().loadFromDatabase();
        } catch (error) {
          console.warn('Background sync failed:', error);
        }
      }, 5000);
    }
  },

  loadFromDatabase: async () => {
    try {
      const [transactionsRes, categoriesRes, accountsRes, settingsRes, savingsCategoriesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories'),
        fetch('/api/accounts'),
        fetch('/api/settings'),
        fetch('/api/savings-categories'),
      ]);

      if (!transactionsRes.ok || !categoriesRes.ok || !accountsRes.ok || !settingsRes.ok || !savingsCategoriesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const transactionsData = await transactionsRes.json();
      const categoriesData = await categoriesRes.json();
      const accountsData = await accountsRes.json();
      const settingsData = await settingsRes.json();
      const savingsCategoriesData = await savingsCategoriesRes.json();

      console.log('[loadFromDatabase] Settings from API:', settingsData.settings?.cardCollapseStates);

      const newState = {
        transactions: transactionsData.transactions || [],
        categories: categoriesData.categories || [],
        accounts: accountsData.accounts || [],
        weeklyCheckins: [],
        savingsCategories: savingsCategoriesData.categories || [],
        settings: settingsData.settings || DEFAULT_SETTINGS,
        error: null,
      };

      set(newState);
      saveToLocalStorage(newState);
      console.log('[loadFromDatabase] Saved to localStorage, cardCollapseStates:', newState.settings.cardCollapseStates);
    } catch (error) {
      console.error('Failed to load from database:', error);
      set({ error: 'Failed to load data from server' });
      throw error;
    }
  },

  // Transactions CRUD with optimistic updates
  addTransaction: async (transaction) => {
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    // Optimistic update
    set((state) => ({
      transactions: [
        ...state.transactions,
        { ...transaction, id: tempId, createdAt, updatedAt } as Transaction,
      ],
    }));

    try {
      const { allocations, ...transactionData } = transaction;
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...transactionData, allocations }),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const { transaction: newTransaction } = await response.json();

      // Replace temp with real transaction
      set((state) => {
        const newState = {
          transactions: state.transactions.map((t) => (t.id === tempId ? newTransaction : t)),
          error: null,
        };
        saveToLocalStorage({ ...state, ...newState });
        return newState;
      });
    } catch (error) {
      // Rollback
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== tempId),
        error: 'Failed to save transaction',
      }));
      throw error;
    }
  },

  updateTransaction: async (id, transaction) => {
    const oldTransaction = get().transactions.find((t) => t.id === id);

    try {
      // Optimistic update
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...transaction } : t)),
      }));

      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      const { transaction: updated } = await response.json();

      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
        error: null,
      }));
    } catch (error) {
      // Rollback
      if (oldTransaction) {
        set((state) => ({
          transactions: state.transactions.map((t) => (t.id === id ? oldTransaction : t)),
          error: 'Failed to update transaction',
        }));
      }
      throw error;
    }
  },

  deleteTransaction: async (id) => {
    const oldTransactions = get().transactions;

    try {
      // Optimistic delete
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));

      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      set({ error: null });
    } catch (error) {
      // Rollback
      set({
        transactions: oldTransactions,
        error: 'Failed to delete transaction',
      });
      throw error;
    }
  },

  getTransactionsByCategory: (categoryId: string) => {
    return get().transactions.filter((t) => t.categoryId === categoryId);
  },

  getTransactionsByDateRange: (startDate: Date, endDate: Date) => {
    return get().transactions.filter((t) => {
      const transDate = new Date(t.date);
      return transDate >= startDate && transDate <= endDate;
    });
  },

  // Categories CRUD
  addCategory: async (category) => {
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    set((state) => ({
      categories: [
        ...state.categories,
        { ...category, id: tempId, createdAt, updatedAt } as Category,
      ],
    }));

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const { category: newCategory } = await response.json();

      set((state) => ({
        categories: state.categories.map((c) => (c.id === tempId ? newCategory : c)),
        error: null,
      }));
    } catch (error) {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== tempId),
        error: 'Failed to save category',
      }));
      throw error;
    }
  },

  updateCategory: async (id, category) => {
    const oldCategory = get().categories.find((c) => c.id === id);

    try {
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
      }));

      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const { category: updated } = await response.json();

      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updated : c)),
        error: null,
      }));
    } catch (error) {
      if (oldCategory) {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? oldCategory : c)),
          error: 'Failed to update category',
        }));
      }
      throw error;
    }
  },

  deleteCategory: async (id) => {
    const oldCategories = get().categories;

    try {
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));

      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      set({ error: null });
    } catch (error) {
      set({
        categories: oldCategories,
        error: 'Failed to delete category',
      });
      throw error;
    }
  },

  getCategories: (type: 'expense' | 'income' | 'all') => {
    const categories = get().categories;
    if (type === 'all') return categories;
    return categories.filter((c) => c.type === type);
  },

  // Accounts CRUD with optimistic updates
  addAccount: async (account) => {
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    // Optimistic update
    set((state) => ({
      accounts: [
        ...state.accounts,
        { ...account, id: tempId, createdAt, updatedAt } as Account,
      ],
    }));

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      const { account: newAccount } = await response.json();

      // Replace temp with real account
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === tempId ? newAccount : a)),
        error: null,
      }));
    } catch (error) {
      // Rollback
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== tempId),
        error: 'Failed to save account',
      }));
      throw error;
    }
  },

  updateAccount: async (id, account) => {
    const oldAccount = get().accounts.find((a) => a.id === id);

    try {
      // Optimistic update
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...account } : a)),
      }));

      const response = await fetch(`/api/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });

      if (!response.ok) {
        throw new Error('Failed to update account');
      }

      const { account: updated } = await response.json();

      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === id ? updated : a)),
        error: null,
      }));
    } catch (error) {
      // Rollback
      if (oldAccount) {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? oldAccount : a)),
          error: 'Failed to update account',
        }));
      }
      throw error;
    }
  },

  deleteAccount: async (id) => {
    const oldAccounts = get().accounts;

    try {
      // Optimistic delete
      set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id),
      }));

      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      set({ error: null });
    } catch (error) {
      // Rollback
      set({
        accounts: oldAccounts,
        error: 'Failed to delete account',
      });
      throw error;
    }
  },

  getAccounts: () => {
    return get().accounts.sort((a, b) => a.order - b.order);
  },

  getDefaultAccount: () => {
    return get().accounts.find((a) => a.isDefault);
  },

  getTransactionsByAccount: (accountId: string) => {
    return get().transactions.filter((t) => t.accountId === accountId);
  },

  // Credit Cards
  getCreditCards: () => {
    const { transactions, accounts } = get();
    return getCreditCardsSummary(transactions, accounts);
  },

  getCreditCardCurrentMonthSpending: (cardId: string) => {
    const { transactions } = get();
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const spending = transactions
      .filter(
        (t) =>
          t.accountId === cardId &&
          t.type === 'expense' &&
          new Date(t.date) >= firstOfMonth &&
          new Date(t.date) <= now
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return spending;
  },

  getCreditCardSpendingHistory: (cardId: string, monthsBack: number = 12) => {
    const { transactions } = get();
    return getCreditCardSpendingHistory(transactions, cardId, monthsBack);
  },

  // Weekly Check-ins CRUD
  addWeeklyCheckin: async (checkin) => {
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();

    set((state) => ({
      weeklyCheckins: [
        ...state.weeklyCheckins,
        { ...checkin, id: tempId, createdAt, updatedAt } as WeeklyCheckin,
      ],
    }));

    try {
      const response = await fetch('/api/weekly-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin),
      });

      if (!response.ok) {
        throw new Error('Failed to create check-in');
      }

      const { checkin: newCheckin } = await response.json();

      set((state) => ({
        weeklyCheckins: state.weeklyCheckins.map((c) => (c.id === tempId ? newCheckin : c)),
        error: null,
      }));
    } catch (error) {
      set((state) => ({
        weeklyCheckins: state.weeklyCheckins.filter((c) => c.id !== tempId),
        error: 'Failed to save check-in',
      }));
      throw error;
    }
  },

  updateWeeklyCheckin: async (id, checkin) => {
    const oldCheckin = get().weeklyCheckins.find((c) => c.id === id);

    try {
      set((state) => ({
        weeklyCheckins: state.weeklyCheckins.map((c) => (c.id === id ? { ...c, ...checkin } : c)),
      }));

      const response = await fetch(`/api/weekly-checkins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkin),
      });

      if (!response.ok) {
        throw new Error('Failed to update check-in');
      }

      const { checkin: updated } = await response.json();

      set((state) => ({
        weeklyCheckins: state.weeklyCheckins.map((c) => (c.id === id ? updated : c)),
        error: null,
      }));
    } catch (error) {
      if (oldCheckin) {
        set((state) => ({
          weeklyCheckins: state.weeklyCheckins.map((c) => (c.id === id ? oldCheckin : c)),
          error: 'Failed to update check-in',
        }));
      }
      throw error;
    }
  },

  getWeeklyCheckins: () => {
    return get().weeklyCheckins.sort((a, b) => {
      return new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime();
    });
  },

  // Savings Categories CRUD with optimistic updates
  getSavingsCategories: () => {
    return get().savingsCategories;
  },

  addSavingsCategory: async (category) => {
    const tempId = uuidv4();
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const userId = get().userId || '';

    // Optimistic update
    set((state) => ({
      savingsCategories: [
        ...state.savingsCategories,
        { ...category, id: tempId, userId, createdAt, updatedAt } as SavingsCategory,
      ],
    }));

    try {
      const response = await fetch('/api/savings-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to create savings category');
      }

      const { category: newCategory } = await response.json();

      set((state) => ({
        savingsCategories: state.savingsCategories.map((c) => (c.id === tempId ? newCategory : c)),
        error: null,
      }));
    } catch (error) {
      // Rollback
      set((state) => ({
        savingsCategories: state.savingsCategories.filter((c) => c.id !== tempId),
        error: 'Failed to create savings category',
      }));
      throw error;
    }
  },

  updateSavingsCategory: async (id, category) => {
    const oldCategory = get().savingsCategories.find((c) => c.id === id);

    try {
      // Optimistic update
      set((state) => ({
        savingsCategories: state.savingsCategories.map((c) => (c.id === id ? { ...c, ...category } : c)),
      }));

      const response = await fetch(`/api/savings-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to update savings category');
      }

      const { category: updated } = await response.json();

      set((state) => ({
        savingsCategories: state.savingsCategories.map((c) => (c.id === id ? updated : c)),
        error: null,
      }));
    } catch (error) {
      // Rollback
      if (oldCategory) {
        set((state) => ({
          savingsCategories: state.savingsCategories.map((c) => (c.id === id ? oldCategory : c)),
          error: 'Failed to update savings category',
        }));
      }
      throw error;
    }
  },

  deleteSavingsCategory: async (id) => {
    const oldCategories = get().savingsCategories;

    try {
      // Optimistic delete
      set((state) => ({
        savingsCategories: state.savingsCategories.filter((c) => c.id !== id),
      }));

      const response = await fetch(`/api/savings-categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete savings category');
      }

      set({ error: null });
    } catch (error) {
      // Rollback
      set({
        savingsCategories: oldCategories,
        error: 'Failed to delete savings category',
      });
      throw error;
    }
  },

  // Settings
  updateSettings: async (settings) => {
    const oldSettings = get().settings;

    try {
      set((state) => ({
        settings: { ...state.settings, ...settings },
      }));

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const { settings: updated } = await response.json();

      set({ settings: updated, error: null });
    } catch (error) {
      set({
        settings: oldSettings,
        error: 'Failed to update settings',
      });
      throw error;
    }
  },

  isCardCollapsed: (cardId: string) => {
    const settings = get().settings;
    try {
      if (settings.cardCollapseStates) {
        const collapseStates = JSON.parse(settings.cardCollapseStates);
        return (collapseStates as any)[cardId] === true;
      }
    } catch (e) {
      // Ignore parse errors
    }
    return false;
  },

  toggleCardCollapse: async (cardId: string) => {
    const currentSettings = get().settings;
    try {
      // Parse current collapse states
      let collapseStates = {};
      if (currentSettings.cardCollapseStates) {
        try {
          collapseStates = JSON.parse(currentSettings.cardCollapseStates);
        } catch (e) {
          collapseStates = {};
        }
      }

      // Toggle the state for this card
      collapseStates = {
        ...collapseStates,
        [cardId]: !(collapseStates as any)[cardId],
      };

      console.log('[toggleCardCollapse] Toggling:', cardId, 'to', collapseStates);

      // Optimistic update
      set((state) => ({
        settings: {
          ...state.settings,
          cardCollapseStates: JSON.stringify(collapseStates),
        },
      }));

      // Save to database
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardCollapseStates: JSON.stringify(collapseStates),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Settings API error status:', response.status);
        console.error('Settings API error body:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.details || 'Failed to save card collapse state');
        } catch (e) {
          throw new Error(`API error (${response.status}): ${errorText}`);
        }
      }

      // Get the updated settings from the response
      const responseData = await response.json();
      const updatedSettings = responseData.settings;

      console.log('[toggleCardCollapse] API response settings.cardCollapseStates:', updatedSettings?.cardCollapseStates);

      // Update store with the official response and save to localStorage
      set((state) => {
        const newState = {
          settings: updatedSettings,
          error: null,
        };
        saveToLocalStorage({ ...state, ...newState });
        console.log('[toggleCardCollapse] Saved to localStorage:', updatedSettings?.cardCollapseStates);
        return newState;
      });
    } catch (error) {
      console.error('Failed to toggle card collapse:', error);
      // Rollback
      set({
        settings: currentSettings,
        error: 'Failed to save card preference',
      });
      throw error;
    }
  },

  // Export data
  exportData: async () => {
    const state = get();
    return {
      transactions: state.transactions,
      categories: state.categories,
      accounts: state.accounts,
      weeklyCheckins: state.weeklyCheckins,
      balanceSnapshots: [],
      settings: state.settings,
    };
  },
}));

export default useAppStore;
