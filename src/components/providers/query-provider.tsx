"use client"

// What? A React Query Provider for the application.
// Why? Next.js App Router root layout needs a client-side provider to wrap all children to enable React Query hooks anywhere in the app.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // What? We initialize QueryClient inside a useState callback.
  // Why? This ensures that the client is only created once per component lifecycle and prevents data loss during re-renders.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
