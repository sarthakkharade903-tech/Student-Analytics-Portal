'use client'

import useSWR from 'swr'
import { useStandard } from '@/lib/StandardContext'
import StudentTable from '@/components/dashboard/StudentTable'
import { Users, Loader2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Student {
  id: string
  name: string
  roll_no: string
  batch: string
  parent_phone: string
  created_at: string
}

export default function StudentsClient() {
  const { standard } = useStandard()

  const { data, isLoading, error } = useSWR<{ students: Student[]; error?: string }>(
    `/api/std-data/students?std=${standard}`,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
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

      {/* Student Table with Search */}
      <StudentTable students={students} standard={standard} />
    </div>
  )
}
