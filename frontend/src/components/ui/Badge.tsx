import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'hit' | 'miss' | 'info' | 'neutral';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  style = {},
  className = '',
  ...rest
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    hit: {
      background: 'rgba(52, 211, 153, 0.16)',
      border: '1px solid rgba(52, 211, 153, 0.4)',
      color: '#34d399',
    },
    miss: {
      background: 'rgba(251, 191, 36, 0.16)',
      border: '1px solid rgba(251, 191, 36, 0.4)',
      color: '#fbbf24',
    },
    info: {
      background: 'rgba(56, 189, 248, 0.16)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      color: '#38bdf8',
    },
    neutral: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.16)',
      color: 'var(--text-secondary, rgba(255, 255, 255, 0.7))',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-pill, 9999px)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        fontFamily: 'inherit',
        ...variantStyles[variant],
        ...style,
      }}
      className={className}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
};

export default Badge;
