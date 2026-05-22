"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /* Data stays fresh 5 min — avoids duplicate API calls on navigation */
        staleTime:            5 * 60 * 1000,
        /* Keep cached data 10 min after last subscriber unmounts */
        gcTime:               10 * 60 * 1000,
        /* Don't refetch just because the window regains focus */
        refetchOnWindowFocus: false,
        /* Don't refetch on reconnect for non-critical data */
        refetchOnReconnect:   "always",
        /* Single retry on error */
        retry:                1,
        retryDelay:           1000,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
