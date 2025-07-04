import * as React from 'react';
import { cn } from '~/lib/utils';

// This is a simplified tooltip implementation
// In a real app, you would use @radix-ui/react-tooltip for better accessibility
// npm install @radix-ui/react-tooltip

const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
  onOpenChange: () => {},
});

interface TooltipProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

export function Tooltip({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  delayDuration = 200,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      setUncontrolledOpen(value);
    },
    [setUncontrolledOpen]
  );

  const onOpenChange = React.useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value);
      controlledOnOpenChange?.(value);
    },
    [controlledOnOpenChange, setUncontrolledOpen]
  );

  // Delay timer for showing/hiding tooltip
  const delayTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleDelayedOpen = React.useCallback(
    (value: boolean) => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }

      if (value) {
        delayTimerRef.current = setTimeout(() => {
          onOpenChange(true);
        }, delayDuration);
      } else {
        onOpenChange(false);
      }
    },
    [delayDuration, onOpenChange]
  );

  React.useEffect(() => {
    return () => {
      if (delayTimerRef.current) {
        clearTimeout(delayTimerRef.current);
      }
    };
  }, []);

  return (
    <TooltipContext.Provider
      value={{ open, setOpen, onOpenChange: handleDelayedOpen }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

export function TooltipTrigger({
  children,
  asChild = false,
  ...props
}: TooltipTriggerProps) {
  const { onOpenChange } = React.useContext(TooltipContext);

  if (asChild) {
    // Handle the case where children might be multiple elements or fragments
    const childrenArray = React.Children.toArray(children);

    if (childrenArray.length === 0) {
      console.warn('TooltipTrigger: No children provided with asChild=true');
      return null;
    }

    if (childrenArray.length > 1) {
      console.warn(
        'TooltipTrigger: Multiple children provided with asChild=true, using first child only'
      );
    }

    const firstChild = childrenArray[0];

    if (!React.isValidElement(firstChild)) {
      console.warn(
        'TooltipTrigger: First child is not a valid React element, falling back to span wrapper'
      );
    } else {
      const child = firstChild as React.ReactElement<
        React.HTMLAttributes<HTMLElement>
      >;

      const {
        onMouseEnter: originalMouseEnter,
        onMouseLeave: originalMouseLeave,
        onFocus: originalFocus,
        onBlur: originalBlur,
      } = child.props || {};

      return React.cloneElement(child, {
        ...child.props,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          onOpenChange(true);
          originalMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          onOpenChange(false);
          originalMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
          onOpenChange(true);
          originalFocus?.(e);
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
          onOpenChange(false);
          originalBlur?.(e);
        },
      });
    }
  }

  return (
    <span
      {...props}
      onMouseEnter={(e) => {
        onOpenChange(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        onOpenChange(false);
        props.onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        onOpenChange(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        onOpenChange(false);
        props.onBlur?.(e);
      }}
    >
      {children}
    </span>
  );
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function TooltipContent({
  children,
  side = 'top',
  align = 'center',
  className,
  ...props
}: TooltipContentProps) {
  const { open } = React.useContext(TooltipContext);

  if (!open) return null;

  // Calculate position classes based on side and align
  const sideClasses = {
    top: 'bottom-full mb-2',
    right: 'left-full ml-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
  };

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
    center:
      side === 'top' || side === 'bottom'
        ? 'left-1/2 -translate-x-1/2'
        : 'top-1/2 -translate-y-1/2',
    end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
  };

  return (
    <div
      className={cn(
        'absolute z-50 max-w-xs px-3 py-2 text-sm',
        'bg-gray-900 text-gray-50 rounded-md shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        sideClasses[side],
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
      <span
        className={cn(
          'absolute w-2 h-2 bg-gray-900 rotate-45',
          side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
          side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2',
          side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
          side === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2'
        )}
      />
    </div>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
