'use client';

import React, { useState, useEffect, ReactNode, CSSProperties } from 'react';
import useAppStore from '@/lib/store';
import { ChevronDown, ChevronRight } from 'lucide-react';
import styles from './ui/Card.module.css';

interface CollapsibleCardProps {
  cardId: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: ReactNode;
  hoverable?: boolean;
  className?: string;
  style?: CSSProperties;
  defaultCollapsed?: boolean;
}

export default function CollapsibleCard({
  cardId,
  defaultCollapsed = false,
  title,
  subtitle,
  action,
  children,
  hoverable = false,
  className = '',
  style = {},
}: CollapsibleCardProps) {
  const { isCardCollapsed, toggleCardCollapse } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Sync with store on mount
  useEffect(() => {
    setIsCollapsed(isCardCollapsed(cardId));
  }, [cardId, isCardCollapsed]);

  const handleToggleCollapse = async () => {
    try {
      await toggleCardCollapse(cardId);
      setIsCollapsed(!isCollapsed);
    } catch (error) {
      console.error('Failed to toggle collapse:', error);
    }
  };

  return (
    <div className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`} style={style}>
      {title && (
        <div className={styles.header} style={{ cursor: 'pointer' }} onClick={handleToggleCollapse}>
          <div className={styles.headerContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              <h3 className={styles.title}>{title}</h3>
            </div>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      <div className={styles.content}>{!isCollapsed && children}</div>
    </div>
  );
}
