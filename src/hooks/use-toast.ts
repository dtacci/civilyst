import * as React from 'react';

type ToastActionElement = {
  label: string;
  action: () => void;
};

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
};

type ToastState = {
  toasts: Toast[];
};

type ToastDispatch = {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
};

// Context placeholder - not used in current implementation but kept for future extensibility
const _ToastContext = React.createContext<ToastState | undefined>(undefined);
const _ToastDispatchContext = React.createContext<ToastDispatch | undefined>(
  undefined
);

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = String(toastCount++);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    toast: addToast,
    dismiss: removeToast,
  };
}
