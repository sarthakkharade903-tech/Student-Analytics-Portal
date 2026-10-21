'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ClipboardList, Plus, Trophy, Users, TrendingUp, Calendar, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import StandardTabs from '@/components/dashboard/StandardTabs'
import type { Test, SubjectConfig } from '@/lib/types'
import { normaliseSubjects } from '@/lib/subjects'

const PAGE_SIZE = 20
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

export default function TestsClient({ batches = [] }: { batches?: string[] }) {
  const searchParams = useSearchParams()
  const standard = searchParams.get('std') === '12th' ? '12th' : '11th'
  const [page, setPage] = useState(1)

  // Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [selectedBatches, setSelectedBatches] = useState<string[]>(['All Batches'])

  // Reset to page 1 when standard changes
  const key = `/api/std-data/tests?std=${standard}&page=${page}`

  const { data, isLoading, error } = useSWR<{ tests: Test[]; total: number; error?: string }>(
    key,
    fetcher,
    { revalidateOnFocus: false }
  )

  const tests = data?.tests ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const errorMsg = data?.error ?? (error ? 'Failed to load tests.' : null)

  const handleCreateOnlineTest = () => {
    const batchParam = encodeURIComponent(selectedBatches.join(','))
    window.open(`http://localhost:3000/student/login?batches=${batchParam}`, '_blank')
    setIsBatchModalOpen(false)
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Batch Selection Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">Select Batches</h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Batches
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBatches(['All Batches'])}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                      selectedBatches.includes('All Batches') 
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-gray-50 text-[var(--muted-foreground)] border-gray-200 hover:border-[var(--primary)]/50'
                    }`}
                  >
                    All Batches
                  </button>
                  {batches.map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setSelectedBatches(prev => {
                          if (prev.includes('All Batches')) return [b]
                          const next = prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
                          return next.length === 0 ? ['All Batches'] : next
                        })
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                        !selectedBatches.includes('All Batches') && selectedBatches.includes(b)
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'bg-gray-50 text-[var(--muted-foreground)] border-gray-200 hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateOnlineTest}
                className="w-full mt-2 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all glow-primary"
              >
                Continue to Test Engine
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-all duration-200 whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Create Online Test
          </button>
          <Link
            id="create-test-btn"
            href={`/dashboard/tests/new?std=${standard}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200 glow-primary whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Upload Offline Test
          </Link>
        </div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)]">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} tests
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-2 text-[var(--muted-foreground)] text-sm">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item as number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === item
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)]'
                    }`}
                  >
                    {item}
                  </button>
                )
              )
            }

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
