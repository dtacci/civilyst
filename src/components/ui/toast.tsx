import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';
import { X } from 'lucide-react';

// Toast context for managing toasts
const ToastContext = React.createContext<{
  toasts: Toast[];
  addToast: (toast: ToastProps) => string;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}>({
  toasts: [],
  addToast: () => '',
  dismissToast: () => {},
  dismissAll: () => {},
});

// Define toast variants using class-variance-authority
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-md transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200',
        destructive:
          'bg-red-50 text-red-800 border-red-200 dark:border-red-800 dark:bg-red-900 dark:text-red-200',
        success:
          'bg-green-50 text-green-800 border-green-200 dark:border-green-800 dark:bg-green-900 dark:text-green-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200',
        warning:
          'bg-orange-50 text-orange-800 border-orange-200 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ToastProps
  // Omit the native `title` attribute to allow ReactNode titles
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof toastVariants> {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  onDismiss?: () => void;
}

export interface Toast extends ToastProps {
  id: string;
  createdAt: Date;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    { className, variant, title, description, action, onDismiss, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex-1 space-y-1">
          {title && <div className="font-medium">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        {action && <div>{action}</div>}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  /* ------------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------- */

  /** Dismiss a toast by id */
  const dismissToast = React.useCallback((id: string) => {
    setToasts((prevToasts) => {
      const toast = prevToasts.find((t) => t.id === id);
      toast?.onDismiss?.();
      return prevToasts.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = React.useCallback(
    (props: ToastProps) => {
      const id =
        props.id ||
        `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const toast: Toast = {
        ...props,
        id,
        createdAt: new Date(),
      };

      setToasts((prevToasts) => [...prevToasts, toast]);

      if (props.duration !== Infinity) {
        setTimeout(() => {
          dismissToast(id);
        }, props.duration || 5000);
      }

      return id;
    },
    [dismissToast]
  );

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, dismissToast, dismissAll }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = React.useMemo(
    () => ({
      ...context,
      toast: (props: ToastProps) => context.addToast(props),
      error: (props: Omit<ToastProps, 'variant'>) =>
        context.addToast({ ...props, variant: 'destructive' }),
      success: (props: Omit<ToastProps, 'variant'>) =>
        context.addToast({ ...props, variant: 'success' }),
      info: (props: Omit<ToastProps, 'variant'>) =>
        context.addToast({ ...props, variant: 'info' }),
      warning: (props: Omit<ToastProps, 'variant'>) =>
        context.addToast({ ...props, variant: 'warning' }),
      dismiss: (id: string) => context.dismissToast(id),
      dismissAll: () => context.dismissAll(),
    }),
    [context]
  );

  return toast;
}

export function Toaster() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          action={toast.action}
          variant={toast.variant}
          className="animate-in slide-in-from-right-full"
          onDismiss={() => dismissToast(toast.id)}
          {...toast}
        />
      ))}
    </div>
  );
}

export { Toast, toastVariants };
