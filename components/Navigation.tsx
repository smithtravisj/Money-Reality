'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useState } from 'react';
import styles from './Navigation.module.css';
import {
  List,
  Wallet,
  PieChart,
  Calendar,
  TrendingUp,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  CreditCard,
} from 'lucide-react';

const menuItems = [
  { name: 'Budget', path: '/budget', icon: PieChart },
  { name: 'Transactions', path: '/transactions', icon: List },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Credit Cards', path: '/credit-cards', icon: CreditCard },
  { name: 'Weekly Check-in', path: '/weekly-checkin', icon: Calendar },
  { name: 'Analytics', path: '/analytics', icon: TrendingUp },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Navigation() {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  if (status !== 'authenticated') {
    return null;
  }

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileDrawerOpen(false);
  };

  const handleSignOut = async () => {
    setIsMobileDrawerOpen(false);
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  // Mobile drawer navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Header with Menu Button */}
        <div className={styles.mobileHeader}>
          <div>
            <h1 className={styles.mobileTitle}>Money Reality</h1>
            {session?.user?.name && (
              <p className={styles.mobileUserName}>{session.user.name}</p>
            )}
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className={styles.menuButton}
            aria-label="Toggle menu"
          >
            {isMobileDrawerOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {isMobileDrawerOpen && (
          <div className={styles.mobileDrawerOverlay} onClick={() => setIsMobileDrawerOpen(false)}>
            <nav className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.navList}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={handleSignOut} className={styles.signOutButton}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar navigation
  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <div className={styles.logo}>
          <h2>Money Reality</h2>
          {session?.user?.name && (
            <p className={styles.userName}>{session.user.name}</p>
          )}
        </div>

        <div className={styles.navList}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                title={item.name}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'auto' }}>
          <button
            onClick={() => handleNavigation('/profile')}
            className={styles.profileButton}
            title="Profile"
          >
            <User size={20} />
            <span>Profile</span>
          </button>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
