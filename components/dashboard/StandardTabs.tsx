'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { startTransition } from 'react'

export default function StandardTabs() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  
  const standard = searchParams.get('std') === '12th' ? '12th' : '11th'

  const handleTabChange = (newStd: '11th' | '12th') => {
    if (newStd === standard) return
    
    // Push the new standard to the URL
    startTransition(() => {
      router.push(`${pathname}?std=${newStd}`)
    })
  }

  return (
    <div className="flex gap-2 border-b border-[var(--border)] pb-4 mb-6">
      <button
        onClick={() => handleTabChange('11th')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          standard === '11th'
            ? 'bg-[var(--primary)] text-primary-foreground shadow-sm'
            : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)]'
        }`}
      >
        Class 11
      </button>
      <button
        onClick={() => handleTabChange('12th')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          standard === '12th'
            ? 'bg-[var(--primary)] text-primary-foreground shadow-sm'
            : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)]'
        }`}
      >
        Class 12
      </button>
    </div>
  )
}
