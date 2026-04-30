import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'demo';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'var(--color-surface-alt)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  },
  success: {
    background: 'var(--color-success-light)',
    color: 'var(--color-success)',
    border: '1px solid rgba(22,163,74,0.2)',
  },
  warning: {
    background: 'var(--color-warning-light)',
    color: 'var(--color-warning)',
    border: '1px solid rgba(217,119,6,0.2)',
  },
  danger: {
    background: 'var(--color-danger-light)',
    color: 'var(--color-danger)',
    border: '1px solid rgba(220,38,38,0.2)',
  },
  info: {
    background: 'var(--color-info-light)',
    color: 'var(--color-info)',
    border: '1px solid rgba(8,145,178,0.2)',
  },
  demo: {
    background: 'var(--color-demo-light)',
    color: 'var(--color-demo)',
    border: '1px solid rgba(124,58,237,0.2)',
  },
};

export default function Badge({ variant = 'default', children, style, ...props }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 1.4,
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
