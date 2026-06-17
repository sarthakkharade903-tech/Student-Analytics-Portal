'use client'

import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import StudentTable from '@/components/dashboard/StudentTable'
import { Users, Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Student {
  id: string
  name: string
  roll_no: string
  batch: string
  parent_phone: string
  pin?: string
  created_at: string
}

// Skeleton row for loading state
function SkeletonRows() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-pulse">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-white/5 grid grid-cols-4 gap-4">
        {['w-16','w-32','w-20','w-24'].map((w,i) => (
          <div key={i} className={`h-3 ${w} bg-white/10 rounded`} />
        ))}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="px-4 py-4 border-b border-[var(--border)] grid grid-cols-4 gap-4 items-center">
          <div className="h-3 w-8 bg-white/10 rounded" />
          <div className="h-3 w-28 bg-white/10 rounded" />
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-3 w-24 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function StudentsClient() {
  // Read standard directly from URL — this is the single source of truth.
  // When the sidebar toggle fires router.replace(), useSearchParams() updates
  // automatically and SWR re-fetches with the correct key. No stale-data race.
  const searchParams = useSearchParams()
  const standard = searchParams.get('std') === '12th' ? '12th' : '11th'

  const { data, isLoading, error } = useSWR<{ students: Student[]; error?: string }>(
    `/api/std-data/students?std=${standard}`,
    fetcher,
    {
      revalidateOnFocus: false,
      // NO keepPreviousData — when standard changes we want a clean load,
      // not the old class's stale data confusing the user.
    }
  )

  const students = data?.students ?? []
  const errorMsg = data?.error ?? (error ? 'Failed to load students.' : null)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
          <Users className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Students — {standard}
            {isLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
            )}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {standard} standard student roster for your coaching institute.
          </p>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-6">
          Failed to load students: {errorMsg}
        </div>
      )}

      {/* Loading skeleton — shows clean shimmer instead of stale wrong-class data */}
      {isLoading ? (
        <SkeletonRows />
      ) : (
        <StudentTable students={students} standard={standard} />
      )}
    </div>
  )
}
