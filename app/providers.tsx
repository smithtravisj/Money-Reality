'use client';

import { SessionProvider } from 'next-auth/react';
import { MobileNavProvider } from '@/context/MobileNavContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <MobileNavProvider>
        {children}
      </MobileNavProvider>
    </SessionProvider>
  );
}
