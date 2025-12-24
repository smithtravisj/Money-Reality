'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from './Navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { status } = useSession();

  // Define layout-less routes
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  // Landing page detection - show for unauthenticated users on root path
  const isLandingPage = pathname === '/' && status === 'unauthenticated';

  // Landing page - full screen, no navigation
  if (isLandingPage) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        {children}
      </div>
    );
  }

  // Auth pages - centered layout
  if (isAuthPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '450px' }}>
          {children}
        </div>
      </div>
    );
  }

  // Mobile layout with drawer navigation
  if (isMobile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navigation />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            paddingBottom: '80px',
          }}
        >
          {children}
        </main>
      </div>
    );
  }

  // Desktop layout with sidebar navigation
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'var(--sidebar-w) 1fr',
        gap: 0,
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
      }}
    >
      <Navigation />
      <main
        style={{
          minWidth: 0,
          paddingBottom: '80px',
        }}
      >
        {children}
      </main>
    </div>
  );
}
