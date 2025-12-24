'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Category, WeeklyCheckin, Settings, AppData } from '@/types';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  currency: 'USD',
  safeThreshold: null,
  tightThreshold: null,
  enableWarnings: true,
  warningThreshold: null,
  defaultPaymentMethod: null,
};

interface AppStore {
  // Data
  transactions: Transaction[];
  categories: Category[];
  weeklyCheckins: WeeklyCheckin[];
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
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];

  // Categories CRUD
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategories: (type: 'expense' | 'income' | 'all') => Category[];

  // Weekly Check-ins CRUD
  addWeeklyCheckin: (checkin: Omit<WeeklyCheckin, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWeeklyCheckin: (id: string, checkin: Partial<WeeklyCheckin>) => Promise<void>;
  getWeeklyCheckins: () => WeeklyCheckin[];

  // Settings
  updateSettings: (settings: Partial<Settings>) => Promise<void>;

  // Import/Export
  exportData: () => Promise<AppData>;
}

const useAppStore = create<AppStore>((set, get) => ({
  transactions: [],
  categories: [],
  weeklyCheckins: [],
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
    try {
      await get().loadFromDatabase();
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ error: 'Failed to load data' });
    } finally {
      set({ loading: false });
    }
  },

  loadFromDatabase: async () => {
    try {
      const [transactionsRes, categoriesRes, checkinsRes, settingsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/categories'),
        fetch('/api/weekly-checkins'),
        fetch('/api/settings'),
      ]);

      if (!transactionsRes.ok || !categoriesRes.ok || !checkinsRes.ok || !settingsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const transactionsData = await transactionsRes.json();
      const categoriesData = await categoriesRes.json();
      const checkinsData = await checkinsRes.json();
      const settingsData = await settingsRes.json();

      set({
        transactions: transactionsData.transactions || [],
        categories: categoriesData.categories || [],
        weeklyCheckins: checkinsData.checkins || [],
        settings: settingsData.settings || DEFAULT_SETTINGS,
        error: null,
      });
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
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const { transaction: newTransaction } = await response.json();

      // Replace temp with real transaction
      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === tempId ? newTransaction : t)),
        error: null,
      }));
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
      set((state) => ({
        transactions: oldTransactions,
        error: 'Failed to delete transaction',
      }));
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
      set((state) => ({
        categories: oldCategories,
        error: 'Failed to delete category',
      }));
      throw error;
    }
  },

  getCategories: (type: 'expense' | 'income' | 'all') => {
    const categories = get().categories;
    if (type === 'all') return categories;
    return categories.filter((c) => c.type === type);
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
      set((state) => ({
        settings: oldSettings,
        error: 'Failed to update settings',
      }));
      throw error;
    }
  },

  // Export data
  exportData: async () => {
    const state = get();
    return {
      transactions: state.transactions,
      categories: state.categories,
      weeklyCheckins: state.weeklyCheckins,
      balanceSnapshots: [],
      settings: state.settings,
    };
  },
}));

export default useAppStore;
