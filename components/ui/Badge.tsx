import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '', style = {} }) => {
  const variantClass = styles[`variant-${variant}`] || styles['variant-neutral'];

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  );
};

export default Badge;
