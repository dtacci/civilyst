import * as React from 'react';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`
          text-[--font-size-sm] font-medium text-[--color-text-primary] 
          leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70
          ${className}
        `.trim()}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export { Label };
