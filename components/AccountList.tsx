'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import { getAccountBalances, calculateTotalNetWorth } from '@/lib/balanceCalculations';
import { formatCurrency } from '@/lib/formatters';
import Card from '@/components/ui/Card';
import styles from './AccountList.module.css';

const ACCOUNT_TYPE_ORDER = {
  checking: 0,
  savings: 1,
  credit: 2,
  cash: 3,
};

const AccountList: React.FC = () => {
  const router = useRouter();
  const { transactions, accounts } = useAppStore();

  const { accountBalances, netWorth } = useMemo(() => {
    const balances = getAccountBalances(transactions, accounts);
    const totalNetWorth = calculateTotalNetWorth(transactions, accounts);

    // Sort by account type
    const sortedBalances = [...balances].sort((a, b) => {
      const typeA = a.accountType.toLowerCase() as keyof typeof ACCOUNT_TYPE_ORDER;
      const typeB = b.accountType.toLowerCase() as keyof typeof ACCOUNT_TYPE_ORDER;
      return (ACCOUNT_TYPE_ORDER[typeA] ?? 999) - (ACCOUNT_TYPE_ORDER[typeB] ?? 999);
    });

    return { accountBalances: sortedBalances, netWorth: totalNetWorth };
  }, [transactions, accounts]);

  // Group accounts by type (must be before early return to satisfy Rules of Hooks)
  const groupedAccounts = useMemo(() => {
    const groups: { [key: string]: typeof accountBalances } = {
      checking: [],
      savings: [],
      credit: [],
      cash: [],
    };

    accountBalances.forEach((account) => {
      const typeKey = account.accountType.toLowerCase();
      if (typeKey in groups) {
        groups[typeKey].push(account);
      }
    });

    return groups;
  }, [accountBalances]);

  if (accounts.length === 0) {
    return (
      <Card title="Accounts" subtitle="No accounts yet">
        <p className={styles.empty}>Create an account to get started</p>
      </Card>
    );
  }

  const accountTypeLabels: { [key: string]: string } = {
    checking: 'Checking Accounts',
    savings: 'Savings Accounts',
    credit: 'Credit Cards',
    cash: 'Cash',
  };

  const accountTypeOrder = ['checking', 'savings', 'credit', 'cash'];

  return (
    <Card
      title="Accounts"
      subtitle={`Total Net Worth: $${formatCurrency(Math.abs(netWorth))}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {accountTypeOrder.map((typeKey) => {
          const accounts = groupedAccounts[typeKey];
          if (accounts.length === 0) return null;

          return (
            <div key={typeKey}>
              <h3
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  margin: '0 0 var(--space-3) 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {accountTypeLabels[typeKey]}
              </h3>
              <div className={styles.accountsGrid}>
                {accounts.map((account) => (
                  <div
                    key={account.accountId}
                    className={styles.accountItem}
                    onClick={() => router.push(`/accounts/${account.accountId}`)}
                  >
                    <h4 className={styles.name}>{account.accountName}</h4>
                    <p className={styles.type}>{account.accountType}</p>
                    <p className={styles.balance}>{account.displayBalance}</p>
                    <p className={styles.transactionCount}>
                      {account.transactionCount} {account.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AccountList;
