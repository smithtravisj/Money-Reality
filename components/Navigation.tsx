'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useState } from 'react';
import styles from './Navigation.module.css';
import {
  LayoutDashboard,
  Plus,
  Minus,
  List,
  FolderTree,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Add Expense', path: '/add-expense', icon: Minus },
  { name: 'Add Income', path: '/add-income', icon: Plus },
  { name: 'Transactions', path: '/transactions', icon: List },
  { name: 'Categories', path: '/categories', icon: FolderTree },
  { name: 'Weekly Check-in', path: '/weekly-checkin', icon: Calendar },
  { name: 'Analytics', path: '/analytics', icon: TrendingUp },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Navigation() {
  const { status } = useSession();
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
          <h1 className={styles.mobileTitle}>Money Reality</h1>
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

        <button onClick={handleSignOut} className={styles.signOutButton}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
