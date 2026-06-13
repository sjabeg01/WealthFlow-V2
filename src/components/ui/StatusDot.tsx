'use client';

import React from 'react';

export type StatusColor = 'green' | 'yellow' | 'red' | 'gray';

interface StatusDotProps {
  color: StatusColor;
  animate?: boolean;
  size?: number;
  className?: string;
}

export default function StatusDot({ 
  color, 
  animate = false, 
  size = 8,
  className = '' 
}: StatusDotProps) {
  
  const getColorValue = () => {
    switch (color) {
      case 'green': return 'var(--color-success, #22c55e)';
      case 'yellow': return 'var(--color-warning, #eab308)';
      case 'red': return 'var(--color-danger, #ef4444)';
      case 'gray': return 'var(--color-text-secondary, #9ca3af)';
      default: return 'var(--color-text-secondary, #9ca3af)';
    }
  };

  const colorValue = getColorValue();

  return (
    <span 
      className={`inline-flex relative ${className}`} 
      style={{ width: size, height: size }}
      role="status"
    >
      {animate && (
        <span 
          className="absolute inline-flex w-full h-full rounded-full opacity-75"
          style={{ 
            backgroundColor: colorValue,
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
          }}
        />
      )}
      <span 
        className="relative inline-flex rounded-full w-full h-full"
        style={{ backgroundColor: colorValue }}
      />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}} />
    </span>
  );
}
