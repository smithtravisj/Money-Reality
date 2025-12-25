'use client';

import React from 'react';
import useAppStore from '@/lib/store';
import { Select } from '@/components/ui/Input';

interface AccountSelectorProps {
  value?: string;
  onChange?: (accountId: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  value,
  onChange,
  label = 'Account',
  error,
  required = true,
}) => {
  const { accounts } = useAppStore();

  const defaultAccount = accounts.find((a) => a.isDefault);
  const selectedAccountId = value || defaultAccount?.id || '';

  const options = accounts.map((account) => ({
    value: account.id,
    label: `${account.name}${account.isDefault ? ' (Default)' : ''}`,
  }));

  return (
    <Select
      label={label}
      value={selectedAccountId}
      onChange={(e) => onChange?.(e.target.value)}
      options={options}
      error={error}
      required={required}
    />
  );
};

export default AccountSelector;
