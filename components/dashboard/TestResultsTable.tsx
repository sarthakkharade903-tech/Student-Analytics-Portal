'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recalculateTestStats } from '@/lib/scoring'
import {
  Upload,
  Hash,
  Trash2,
  Loader2,
  AlertTriangle,
  Search,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScoreRecord {
  id: string
  rank: number
  total: number
  percentage: number
  subject_scores: Record<string, number>
  is_absent: boolean
  student: { id: string; name: string; roll_no: string } | null
}

interface TestResultsTableProps {
  testId: string
  maxMarks: number
  subjects: string[]
  initialScores: ScoreRecord[]
  uploadHref: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PercentageBadge({ pct }: { pct: number }) {
  const color =
    pct >= 75
      ? 'text-green-400 bg-green-500/10 border-green-500/20'
      : pct >= 50
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      : 'text-red-400 bg-red-500/10 border-red-500/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${color}`}>
      {pct.toFixed(1)}%
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/15 text-yellow-400 text-sm font-bold border border-yellow-500/30">
        🥇
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/10 text-slate-300 text-sm font-bold border border-slate-400/20">
        🥈
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/10 text-orange-400 text-sm font-bold border border-orange-500/20">
        🥉
      </span>
    )
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] text-xs font-semibold">
      {rank}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function TestResultsTable({
  testId,
  maxMarks,
  subjects,
  initialScores,
  uploadHref,
}: TestResultsTableProps) {
  const router = useRouter()
  const [scores, setScores] = useState<ScoreRecord[]>(initialScores)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const hasResults = scores.length > 0
  
  const filteredScores = scores.filter(score => 
    !searchQuery || 
    (score.student?.roll_no?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Grid template: Rank | Roll | Name | ...subjects | Total | % | Delete
  const colTemplate = `56px 80px 1fr repeat(${subjects.length}, 72px) 80px 90px 48px`

  const handleDelete = async (score: ScoreRecord) => {
    setDeletingId(score.id)
    setDeleteError(null)
    const supabase = createClient()

    // 1. Delete the score row
    const { error: delErr } = await supabase
      .from('scores')
      .delete()
      .eq('id', score.id)

    if (delErr) {
      setDeleteError(`Failed to delete: ${delErr.message}`)
      setDeletingId(null)
      setConfirmId(null)
      return
    }

    // 2. Optimistic local update — remove row from UI
    const remaining = scores.filter((s) => s.id !== score.id)
    setScores(remaining)
    setDeletingId(null)
    setConfirmId(null)

    // 3. Recalculate ranks + test aggregates (centralized)
    await recalculateTestStats(supabase, testId)

    router.refresh()
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.5)] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Results</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {hasResults
              ? `${scores.length} student${scores.length !== 1 ? 's' : ''} appeared`
              : 'No results uploaded yet'}
          </p>
        </div>
        {hasResults && (
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search by Roll No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-lg bg-[oklch(0.62_0.22_265/0.1)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)] w-48"
              />
            </div>
            <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 hidden md:flex">
              <Hash className="w-3.5 h-3.5" />
              Sorted by rank
            </span>
          </div>
        )}
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="mx-5 mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {deleteError}
        </div>
      )}

      {/* Empty state */}
      {!hasResults ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.62_0.22_265/0.08)] flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="font-semibold mb-2">No results yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-5">
            Upload a CSV file with student marks to see results here.
          </p>
          <Link
            href={uploadHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all glow-primary"
          >
            <Upload className="w-4 h-4" />
            Upload Results
          </Link>
        </div>
      ) : (
        <>
          {/* Table header */}
          <div
            className="grid gap-3 px-5 py-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.3)] text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
            style={{ gridTemplateColumns: colTemplate }}
          >
            <span>Rank</span>
            <span>Roll No.</span>
            <span>Name</span>
            {subjects.map((s) => (
              <span key={s} className="text-center capitalize">{s}</span>
            ))}
            <span className="text-center">Total</span>
            <span className="text-center">%</span>
            <span>{/* Actions */}</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--border)]">
            {filteredScores.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
                No students found matching "{searchQuery}"
              </div>
            ) : (
              filteredScores.map((score, idx) => {
                const isConfirming = confirmId === score.id
                const isDeleting = deletingId === score.id

              return (
                <div key={score.id}>
                  {/* Main row */}
                  <div
                    className={`grid gap-3 px-5 py-3.5 items-center text-sm transition-colors ${
                      isConfirming
                        ? 'bg-red-500/5'
                        : idx % 2 !== 0
                        ? 'bg-[oklch(0.10_0.01_240/0.3)] hover:bg-[oklch(0.62_0.22_265/0.03)]'
                        : 'hover:bg-[oklch(0.62_0.22_265/0.03)]'
                    }`}
                    style={{ gridTemplateColumns: colTemplate }}
                  >
                    {/* Rank */}
                    <div className="flex items-center">
                      {score.is_absent ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20">
                          —
                        </span>
                      ) : (
                        <RankBadge rank={score.rank} />
                      )}
                    </div>

                    {/* Roll No */}
                    <span className="font-mono text-xs text-[var(--primary)] bg-[oklch(0.62_0.22_265/0.1)] px-2 py-0.5 rounded-md inline-block">
                      {score.student?.roll_no ?? '—'}
                    </span>

                    {/* Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-[var(--primary)]">
                          {score.student?.name.charAt(0).toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <span className="font-medium truncate">{score.student?.name ?? 'Unknown'}</span>
                    </div>

                    {/* Subject scores */}
                    {subjects.map((s) => (
                      <span key={s} className="text-center text-[var(--muted-foreground)]">
                        {score.is_absent ? '—' : (score.subject_scores?.[s] ?? '—')}
                      </span>
                    ))}

                    {/* Total */}
                    <span className="text-center font-semibold">
                      {score.is_absent ? '—' : score.total}
                    </span>

                    {/* % */}
                    <div className="flex justify-center">
                      {score.is_absent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold text-red-400 bg-red-500/10 border-red-500/20">
                          ABSENT
                        </span>
                      ) : (
                        <PercentageBadge pct={score.percentage} />
                      )}
                    </div>

                    {/* Delete button */}
                    <div className="flex items-center justify-end">
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <button
                          id={`delete-score-${score.id}`}
                          onClick={() => {
                            setDeleteError(null)
                            setConfirmId(isConfirming ? null : score.id)
                          }}
                          title="Delete this score"
                          className={`p-1.5 rounded-lg transition-all duration-150 ${
                            isConfirming
                              ? 'bg-red-500/15 text-red-400'
                              : 'text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline confirm strip */}
                  {isConfirming && !isDeleting && (
                    <div className="px-5 py-3 bg-red-500/5 border-t border-red-500/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          Delete score for <strong>{score.student?.name ?? 'this student'}</strong>
                          {score.student?.roll_no ? ` (Roll ${score.student.roll_no})` : ''}?
                          Ranks will be recalculated.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          id={`confirm-delete-score-${score.id}`}
                          onClick={() => handleDelete(score)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            }))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[var(--border)] bg-[oklch(0.10_0.01_240/0.3)]">
            <span className="text-xs text-[var(--muted-foreground)]">
              {scores.length} student{scores.length !== 1 ? 's' : ''} · Max marks: {maxMarks}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
