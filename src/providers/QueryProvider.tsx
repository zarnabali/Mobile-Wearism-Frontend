import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Note: ReactQueryDevtools doesn't work in React Native - it's for web only

// Create a client with React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Background refetch every 30 seconds
      refetchInterval: 30 * 1000,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Note: ReactQueryDevtools doesn't work in React Native - it's for web browsers only */}
    </QueryClientProvider>
  );
}

export { queryClient };
