import * as React from 'react';

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { id, checked = false, onCheckedChange, disabled = false, className = '' },
    ref
  ) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full 
          border-2 border-transparent transition-colors 
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] 
          focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-background] 
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? 'bg-[--color-primary]' : 'bg-[--color-border]'}
          ${className}
        `.trim()}
      >
        <span
          className={`
            pointer-events-none block h-5 w-5 rounded-full bg-[--color-surface] 
            shadow-lg ring-0 transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `.trim()}
        />
      </button>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
