import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

// Define button variants using class-variance-authority
const buttonVariants = cva(
  // Base styles applied to all buttons
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        outline:
          'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400',
        ghost:
          'bg-transparent hover:bg-gray-100 text-gray-900 hover:text-gray-900 data-[state=open]:bg-transparent',
        link: 'bg-transparent text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-2',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
