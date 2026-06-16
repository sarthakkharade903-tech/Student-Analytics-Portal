'use client'

import { useStandard } from '@/lib/StandardContext'
import { Loader2 } from 'lucide-react'

export default function StandardSwitcher() {
  const { standard, setStandard, isPending } = useStandard()

  return (
    <div className="mx-3 mb-1 mt-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] px-1 mb-1.5">
        Class Standard
      </p>
      <div className="flex rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--secondary)] relative">
        <button
          onClick={() => setStandard('11th')}
          disabled={isPending}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all duration-200 ${
            standard === '11th'
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          11th
        </button>
        <button
          onClick={() => setStandard('12th')}
          disabled={isPending}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all duration-200 ${
            standard === '12th'
              ? 'bg-[var(--primary)] text-white shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          12th
        </button>
        {/* Subtle loading indicator — doesn't block the UI */}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg pointer-events-none">
            <Loader2 className="w-3 h-3 animate-spin text-[var(--primary)]" />
          </div>
        )}
      </div>
    </div>
  )
}
