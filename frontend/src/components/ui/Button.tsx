import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'glass',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style = {},
  className = '',
  ...rest
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-pill, 9999px)' },
    md: { padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-pill, 9999px)' },
    lg: { padding: '12px 24px', fontSize: '15px', borderRadius: 'var(--radius-md, 14px)' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.22)',
      color: 'var(--text-primary, #ffffff)',
    },
    primary: {
      background: 'linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      color: '#ffffff',
      boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      color: 'var(--text-secondary, rgba(255, 255, 255, 0.7))',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      color: '#f87171',
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        outline: 'none',
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={className}
      {...rest}
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
