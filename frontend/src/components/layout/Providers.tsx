"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { AuthProvider } from "@/contexts/AuthContext"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:            5 * 60 * 1000,
        gcTime:               10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect:   "always",
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
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
