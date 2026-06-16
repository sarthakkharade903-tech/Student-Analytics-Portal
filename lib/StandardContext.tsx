'use client'

import React, { createContext, useContext, useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Standard = '11th' | '12th'

interface StandardContextValue {
  standard: Standard
  setStandard: (std: Standard) => void
  isPending: boolean
}

const StandardContext = createContext<StandardContextValue>({
  standard: '11th',
  setStandard: () => {},
  isPending: false,
})

export function StandardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const initial: Standard = searchParams.get('std') === '12th' ? '12th' : '11th'
  const [standard, setStandardState] = useState<Standard>(initial)

  // Keep local state in sync if user navigates via browser back/forward
  useEffect(() => {
    const fromUrl: Standard = searchParams.get('std') === '12th' ? '12th' : '11th'
    setStandardState(fromUrl)
  }, [searchParams])

  const setStandard = useCallback((std: Standard) => {
    // 1. Update React state IMMEDIATELY — UI is instant
    setStandardState(std)
    // 2. Update URL in background without blocking the UI
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('std', std)
      router.replace(`${pathname}?${params.toString()}`)
    })
  }, [router, pathname, searchParams])

  return (
    <StandardContext.Provider value={{ standard, setStandard, isPending }}>
      {children}
    </StandardContext.Provider>
  )
}

export function useStandard() {
  return useContext(StandardContext)
}
