'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useMobileNav } from '@/context/MobileNavContext';
import styles from './Navigation.module.css';
import {
  List,
  Wallet,
  PieChart,
  TrendingUp,
  Settings,
  User,
  LogOut,
  CreditCard,
  Gift,
} from 'lucide-react';

const menuItems = [
  { name: 'Budget', path: '/budget', icon: PieChart },
  { name: 'Transactions', path: '/transactions', icon: List },
  { name: 'Credit Cards', path: '/credit-cards', icon: CreditCard },
  { name: 'Gift Cards', path: '/gift-cards', icon: Gift },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Analytics', path: '/analytics', icon: TrendingUp },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Navigation() {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { isDrawerOpen, closeDrawer } = useMobileNav();

  if (status !== 'authenticated') {
    return null;
  }

  const handleNavigation = (path: string) => {
    router.push(path);
    closeDrawer();
  };

  const handleSignOut = async () => {
    closeDrawer();
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  // Mobile drawer navigation
  if (isMobile) {
    return (
      <>
        {/* Mobile Drawer */}
        {isDrawerOpen && (
          <div className={styles.mobileDrawerOverlay} onClick={closeDrawer}>
            <nav className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.mobileDrawerTitle}>
                <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 'var(--font-size-3xl)', fontWeight: '600' }}>
                  Money Reality
                </h2>
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
