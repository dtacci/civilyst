import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

// Mobile-first button variants using our design tokens
const buttonVariants = cva(
  // Base styles - mobile-first with touch optimization
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-medium transition-all duration-[--duration-normal]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]',
    'disabled:pointer-events-none disabled:opacity-50',
    // Mobile touch optimizations
    'min-h-[--space-touch-target] min-w-[--space-touch-target]',
    'rounded-[--border-radius-md] px-4 py-2',
    'touch-manipulation select-none',
    // Active state with scale feedback
    'active:scale-[0.98] active:transition-transform active:duration-[--duration-fast]',
    // Remove default button styles
    'border-0 outline-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[--color-primary] text-[--color-text-inverse]',
          'hover:bg-[--color-primary-hover]',
          'active:bg-[--color-primary-active]',
          'shadow-[--shadow-touch]',
          'hover:shadow-[--shadow-elevated]',
        ],
        destructive: [
          'bg-[--color-danger] text-[--color-text-inverse]',
          'hover:bg-[--color-danger-hover]',
          'shadow-[--shadow-touch]',
          'hover:shadow-[--shadow-elevated]',
        ],
        success: [
          'bg-[--color-accent] text-[--color-text-inverse]',
          'hover:bg-[--color-accent-hover]',
          'shadow-[--shadow-touch]',
          'hover:shadow-[--shadow-elevated]',
        ],
        outline: [
          'border-2 border-[--color-border] bg-transparent',
          'text-[--color-text-primary]',
          'hover:bg-[--color-surface] hover:border-[--color-primary]',
          'hover:text-[--color-primary]',
        ],
        secondary: [
          'bg-[--color-secondary] text-[--color-text-inverse]',
          'hover:bg-[--color-secondary-hover]',
          'shadow-[--shadow-touch]',
          'hover:shadow-[--shadow-elevated]',
        ],
        ghost: [
          'bg-transparent text-[--color-text-primary]',
          'hover:bg-[--color-surface]',
          'hover:text-[--color-primary]',
        ],
        link: [
          'text-[--color-primary] underline-offset-4',
          'hover:underline hover:text-[--color-primary-hover]',
          'min-h-auto min-w-auto p-0',
          'active:scale-100', // No scale effect for links
        ],
      },
      size: {
        default: [
          'h-11 px-4 py-2',
          'text-[--font-size-base]',
          'rounded-[--border-radius-md]',
        ],
        sm: [
          'h-9 px-3 py-1',
          'text-[--font-size-sm]',
          'rounded-[--border-radius-sm]',
        ],
        lg: [
          'h-12 px-6 py-3',
          'text-[--font-size-lg]', 
          'rounded-[--border-radius-lg]',
          'font-semibold',
        ],
        xl: [
          'h-14 px-8 py-4',
          'text-[--font-size-xl]',
          'rounded-[--border-radius-xl]',
          'font-semibold',
        ],
        icon: [
          'h-11 w-11 p-0',
          'rounded-[--border-radius-md]',
          'flex items-center justify-center',
        ],
        fab: [
          'h-14 w-14 p-0',
          'rounded-[--border-radius-full]',
          'shadow-[--shadow-elevated]',
          'hover:shadow-[--shadow-modal]',
          'fixed bottom-4 right-4 z-[--z-fixed]',
        ],
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      loading: {
        true: 'cursor-not-allowed opacity-70',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      className, 
      variant, 
      size, 
      fullWidth, 
      loading, 
      leftIcon, 
      rightIcon, 
      asChild = false, 
      children, 
      disabled,
      loadingText,
      ...props 
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    // Disable button when loading
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {!loading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        <span className="flex-1 truncate">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
