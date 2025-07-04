'use client';

import { ReactNode } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface MobileAnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'danger';
  onClick?: () => void;
  className?: string;
}

export function MobileAnalyticsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  onClick,
  className = '',
}: MobileAnalyticsCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-[--color-primary-light]',
      text: 'text-[--color-primary]',
      icon: 'text-[--color-primary]',
    },
    secondary: {
      bg: 'bg-[--color-secondary-light]',
      text: 'text-[--color-secondary]',
      icon: 'text-[--color-secondary]',
    },
    accent: {
      bg: 'bg-[--color-accent-light]',
      text: 'text-[--color-accent]',
      icon: 'text-[--color-accent]',
    },
    warning: {
      bg: 'bg-[--color-warning-light]',
      text: 'text-[--color-warning]',
      icon: 'text-[--color-warning]',
    },
    danger: {
      bg: 'bg-[--color-danger-light]',
      text: 'text-[--color-danger]',
      icon: 'text-[--color-danger]',
    },
  };

  const colors = colorClasses[color];

  const CardContent = (
    <div
      className={`
      bg-[--color-surface-elevated] 
      rounded-[--border-radius-lg] 
      p-[--space-lg] 
      border border-[--color-border]
      shadow-[--shadow-touch]
      transition-all duration-[--duration-normal] ease-[--ease-out]
      ${onClick ? 'hover:shadow-[--shadow-elevated] active:scale-[0.98]' : ''}
      ${className}
    `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Title */}
          <h3 className="text-[--font-size-sm] font-medium text-[--color-text-secondary] mb-[--space-xs]">
            {title}
          </h3>

          {/* Main Value */}
          <div className="flex items-baseline mb-[--space-sm]">
            <span className={`text-[--font-size-3xl] font-bold ${colors.text}`}>
              {value}
            </span>
            {subtitle && (
              <span className="ml-[--space-xs] text-[--font-size-sm] text-[--color-text-tertiary]">
                {subtitle}
              </span>
            )}
          </div>

          {/* Trend Indicator */}
          {trend && (
            <div className="flex items-center">
              <div
                className={`
                flex items-center px-[--space-sm] py-[--space-xs] 
                rounded-[--border-radius-full] text-[--font-size-xs] font-medium
                ${
                  trend.positive
                    ? 'bg-[--color-accent-light] text-[--color-accent]'
                    : 'bg-[--color-danger-light] text-[--color-danger]'
                }
              `}
              >
                <span className="mr-1">{trend.positive ? '↗' : '↘'}</span>
                {Math.abs(trend.value)}%
              </div>
              <span className="ml-[--space-sm] text-[--font-size-xs] text-[--color-text-tertiary]">
                {trend.label}
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={`
            w-12 h-12 rounded-[--border-radius-lg] ${colors.bg}
            flex items-center justify-center ${colors.icon}
            flex-shrink-0
          `}
          >
            {icon}
          </div>
        )}

        {/* Clickable indicator */}
        {onClick && (
          <ChevronRightIcon className="w-5 h-5 text-[--color-text-tertiary] ml-[--space-sm] flex-shrink-0" />
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[--color-border-focus] rounded-[--border-radius-lg]"
        style={{ minHeight: 'var(--space-touch-target)' }}
      >
        {CardContent}
      </button>
    );
  }

  return CardContent;
}
