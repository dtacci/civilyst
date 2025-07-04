import * as React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`
          flex h-10 w-full rounded-[--border-radius-md] border border-[--color-border] 
          bg-[--color-surface] px-3 py-2 text-[--font-size-sm] text-[--color-text-primary]
          ring-offset-[--color-background] file:border-0 file:bg-transparent 
          file:text-[--font-size-sm] file:font-medium placeholder:text-[--color-text-tertiary] 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] 
          focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
          ${className}
        `.trim()}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
