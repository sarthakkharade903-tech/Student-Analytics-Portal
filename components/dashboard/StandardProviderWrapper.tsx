'use client'

import { Suspense } from 'react'
import { StandardProvider } from '@/lib/StandardContext'

export default function StandardProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <StandardProvider>{children}</StandardProvider>
    </Suspense>
  )
}
