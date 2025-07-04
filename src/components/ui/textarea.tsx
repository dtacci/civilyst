import * as React from 'react';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        className={`
          flex min-h-[80px] w-full rounded-[--border-radius-md] border border-[--color-border] 
          bg-[--color-surface] px-3 py-2 text-[--font-size-sm] text-[--color-text-primary]
          ring-offset-[--color-background] placeholder:text-[--color-text-tertiary] 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] 
          focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
          resize-vertical
          ${className}
        `.trim()}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
