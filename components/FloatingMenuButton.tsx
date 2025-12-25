'use client';

import { useMobileNav } from '@/context/MobileNavContext';
import { Menu } from 'lucide-react';
import styles from './FloatingMenuButton.module.css';

export function FloatingMenuButton() {
  const { toggleDrawer } = useMobileNav();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleDrawer();
  };

  return (
    <button
      onClick={handleClick}
      className={styles.fab}
      aria-label="Open menu"
      type="button"
    >
      <Menu size={24} color="white" />
    </button>
  );
}
