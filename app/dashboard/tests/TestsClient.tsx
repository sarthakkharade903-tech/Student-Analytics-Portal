'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ClipboardList, Plus, Trophy, Users, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import StandardTabs from '@/components/dashboard/StandardTabs'
import type { Test, SubjectConfig } from '@/lib/types'
import { normaliseSubjects } from '@/lib/subjects'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function SubjectPill({ subject }: { subject: SubjectConfig }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[oklch(0.62_0.22_265/0.12)] text-[var(--primary)] text-xs font-medium capitalize">
      {subject.name}
      {subject.max_marks > 0 && (
        <span className="text-[var(--primary)] opacity-50 font-normal">·{subject.max_marks}</span>
      )}
    </span>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function TestsClient() {
  const searchParams = useSearchParams()
  const standard = searchParams.get('std') === '12th' ? '12th' : '11th'

  const { data, isLoading, error } = useSWR<{ tests: Test[]; error?: string }>(
    `/api/std-data/tests?std=${standard}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const tests = data?.tests ?? []
  const errorMsg = data?.error ?? (error ? 'Failed to load tests.' : null)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Tests — {standard}
              {isLoading && (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
              )}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Manage {standard} standard tests, upload marks, and view results.
            </p>
          </div>
        </div>
        <Link
          id="create-test-btn"
          href={`/dashboard/tests/new?std=${standard}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200 glow-primary whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create Test
        </Link>
      </div>

      <StandardTabs />

      {/* Error state */}
      {errorMsg && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-6 mt-6">
          Failed to load tests: {errorMsg}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!tests || tests.length === 0) && !errorMsg && (
        <div className="glass-card rounded-2xl py-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[oklch(0.62_0.22_265/0.1)] flex items-center justify-center mb-5">
            <ClipboardList className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-6">
            Create your first test and upload a CSV file with student marks to get started.
          </p>
          <Link
            href={`/dashboard/tests/new?std=${standard}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all glow-primary"
          >
            <Plus className="w-4 h-4" />
            Create First Test
          </Link>
        </div>
      )}

      {/* Tests Grid */}
      {tests && tests.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tests as Test[]).map((test) => (
            <Link
              key={test.id}
              href={`/dashboard/tests/${test.id}?std=${standard}`}
              className="glass-card rounded-2xl p-5 group hover:border-[oklch(0.62_0.22_265/0.4)] transition-all duration-200 block"
            >
              {/* Test name + date */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h2 className="font-semibold text-base leading-tight group-hover:text-[var(--primary)] transition-colors">
                  {test.test_name}
                </h2>
                <span className="flex-shrink-0 flex items-center gap-1 text-xs text-[var(--muted-foreground)] mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(test.test_date)}
                </span>
              </div>

              {/* Subject pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {normaliseSubjects(test.subjects ?? []).map((s) => (
                  <SubjectPill key={s.name} subject={s} />
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border)]">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm font-semibold">
                    {test.students_appeared ?? '—'}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Appeared</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm font-semibold">
                    {test.highest_score != null ? test.highest_score : '—'}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Highest</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-sm font-semibold">
                    {test.average_score != null ? Number(test.average_score).toFixed(1) : '—'}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Average</p>
                </div>
              </div>

              {/* Max marks badge */}
              <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Max marks: <span className="text-[var(--foreground)] font-medium">{test.max_marks}</span></span>
                {test.students_appeared == null && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-medium">
                    No results yet
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
