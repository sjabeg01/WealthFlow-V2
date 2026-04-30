'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontFamily: 'var(--font-family)',
  fontWeight: 500,
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid transparent',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  whiteSpace: 'nowrap',
  outline: 'none',
  userSelect: 'none',
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-accent)',
    color: 'white',
    borderColor: 'var(--color-accent)',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    borderColor: 'var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    borderColor: 'transparent',
  },
  danger: {
    background: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    borderColor: 'var(--color-danger)',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '0.375rem 0.75rem', fontSize: '0.8125rem' },
  md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
  lg: { padding: '0.75rem 1.25rem', fontSize: '0.9375rem' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(isDisabled ? { opacity: 0.55, cursor: 'not-allowed' } : {}),
        ...style,
      }}
    >
      {icon && !loading && icon}
      {loading && (
        <span style={{
          width: '14px',
          height: '14px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.6s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
