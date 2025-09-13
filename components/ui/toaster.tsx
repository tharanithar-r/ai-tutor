// Simple toaster implementation for now

interface ToastOptions {
  title: string;
  description?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const toaster = {
  create: (options: ToastOptions) => {
    // This is a simplified implementation
    // In a real app, you'd use the Chakra UI toast system
    console.log('Toast:', options);
  }
};

export const useToaster = () => {
  return {
    create: (options: ToastOptions) => {
      console.log('Toast:', options);
    }
  };
};
