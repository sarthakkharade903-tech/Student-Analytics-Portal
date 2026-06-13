'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function StandardSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('std') ?? '11th'

  const switchTo = useCallback((std: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('std', std)
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <div className="mx-3 mb-1 mt-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] px-1 mb-1.5">
        Class Standard
      </p>
      <div className="flex rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--secondary)]">
        <button
          onClick={() => switchTo('11th')}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all duration-200 ${
            current === '11th'
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          11th
        </button>
        <button
          onClick={() => switchTo('12th')}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all duration-200 ${
            current === '12th'
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          12th
        </button>
      </div>
    </div>
  )
}
