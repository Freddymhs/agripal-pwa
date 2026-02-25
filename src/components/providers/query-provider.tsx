'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/react-query'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? dynamic(
      () => import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools),
      { ssr: false }
    )
  : () => null

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
