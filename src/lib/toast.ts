import { ToastProps } from '~/components/ui/toast';

// Type for the toast methods
type ToastMethod = (message: string | ToastProps) => string;

interface ToastAPI {
  success: ToastMethod;
  error: ToastMethod;
  info: ToastMethod;
  warning: ToastMethod;
  toast: (props: ToastProps) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// Create a singleton instance that will be populated by the ToastProvider
let toastInstance: ToastAPI | null = null;

// Export a proxy that will use the instance when available
export const toast: ToastAPI = {
  success: (message) => {
    if (!toastInstance) {
      console.warn('Toast called before initialization. Make sure ToastProvider is rendered.');
      return '';
    }
    const props = typeof message === 'string' ? { title: message } : message;
    return toastInstance.success(props);
  },
  error: (message) => {
    if (!toastInstance) {
      console.warn('Toast called before initialization. Make sure ToastProvider is rendered.');
      return '';
    }
    const props = typeof message === 'string' ? { title: message } : message;
    return toastInstance.error(props);
  },
  info: (message) => {
    if (!toastInstance) {
      console.warn('Toast called before initialization. Make sure ToastProvider is rendered.');
      return '';
    }
    const props = typeof message === 'string' ? { title: message } : message;
    return toastInstance.info(props);
  },
  warning: (message) => {
    if (!toastInstance) {
      console.warn('Toast called before initialization. Make sure ToastProvider is rendered.');
      return '';
    }
    const props = typeof message === 'string' ? { title: message } : message;
    return toastInstance.warning(props);
  },
  toast: (props) => {
    if (!toastInstance) {
      console.warn('Toast called before initialization. Make sure ToastProvider is rendered.');
      return '';
    }
    return toastInstance.toast(props);
  },
  dismiss: (id) => {
    if (!toastInstance) {
      console.warn('Toast called before initialization. Make sure ToastProvider is rendered.');
      return;
    }
    toastInstance.dismiss(id);
  },
  dismissAll: () => {
    if (!toastInstance) {
      console.warn('Toast called before initialization. Make sure ToastProvider is rendered.');
      return;
    }
    toastInstance.dismissAll();
  },
};

// Function to initialize the toast instance (called by ToastProvider)
export function initializeToast(instance: ToastAPI) {
  toastInstance = instance;
}