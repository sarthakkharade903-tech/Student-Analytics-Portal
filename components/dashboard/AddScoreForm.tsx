'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recalculateTestStats } from '@/lib/scoring'
import { normaliseSubjects } from '@/lib/subjects'
import type { SubjectConfig } from '@/lib/types'
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AddScoreFormProps {
  testId: string
  subjects: SubjectConfig[] | string[]
  maxMarks: number
  coachingCenterId: string
}

// ── Input class ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm'

const inputOverCls =
  'w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm'

// ─────────────────────────────────────────────────────────────────────────────

export default function AddScoreForm({
  testId,
  subjects: rawSubjects,
  maxMarks,
  coachingCenterId,
}: AddScoreFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rollNo, setRollNo] = useState('')
  const [marks, setMarks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Normalise subjects
  const subjects: SubjectConfig[] = normaliseSubjects(rawSubjects)

  const resetForm = useCallback(() => {
    setRollNo('')
    setMarks({})
    setError(null)
    setSuccess(null)
  }, [])

  // Live total preview
  const liveTotal = subjects.reduce((acc, s) => {
    const n = Number(marks[s.name] ?? 0)
    return acc + (isNaN(n) ? 0 : n)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // ── Validate inputs ──────────────────────────────────────────────────────

    const trimmedRoll = rollNo.trim()
    if (!trimmedRoll) {
      setError('Roll number is required.')
      return
    }

    const subjectScores: Record<string, number> = {}
    let total = 0

    for (const s of subjects) {
      const raw = (marks[s.name] ?? '').trim()
      if (raw === '') {
        setError(`Marks for ${s.name} are required.`)
        return
      }
      const num = Number(raw)
      if (isNaN(num) || num < 0) {
        setError(`Marks for ${s.name} must be a non-negative number.`)
        return
      }
      if (s.max_marks > 0 && num > s.max_marks) {
        setError(`Marks for ${s.name} (${num}) cannot exceed its max (${s.max_marks}).`)
        return
      }
      subjectScores[s.name] = num
      total += num
    }

    const percentage = parseFloat(((total / maxMarks) * 100).toFixed(2))

    setLoading(true)
    const supabase = createClient()

    // ── Look up student by roll_no ───────────────────────────────────────────

    const { data: studentData, error: studentErr } = await supabase
      .from('students')
      .select('id, name, roll_no')
      .eq('coaching_center_id', coachingCenterId)
      .ilike('roll_no', trimmedRoll)
      .single()

    if (studentErr || !studentData) {
      setError(`Roll No. "${trimmedRoll}" not found in your students list.`)
      setLoading(false)
      return
    }

    // ── Check for duplicate score ────────────────────────────────────────────

    const { data: existingScoreData } = await supabase
      .from('scores')
      .select('id, is_absent')
      .eq('test_id', testId)
      .eq('student_id', studentData.id)
      .maybeSingle()

    if (existingScoreData && !existingScoreData.is_absent) {
      setError(`${studentData.name} already has a score recorded for this test.`)
      setLoading(false)
      return
    }

    // ── Insert or Update score ───────────────────────────────────────────────

    const scorePayload = {
      test_id: testId,
      student_id: studentData.id,
      subject_scores: subjectScores,
      total,
      percentage,
      rank: null as number | null,
      is_absent: false,
    }

    let saveErr
    if (existingScoreData) {
      const { error } = await supabase.from('scores').update(scorePayload).eq('id', existingScoreData.id)
      saveErr = error
    } else {
      const { error } = await supabase.from('scores').insert(scorePayload)
      saveErr = error
    }

    if (saveErr) {
      setError(`Failed to save score: ${saveErr.message}`)
      setLoading(false)
      return
    }

    await recalculateTestStats(supabase, testId)

    setSuccess(`Score saved for ${studentData.name} — ${total}/${maxMarks} (${percentage}%)`)
    setLoading(false)
    resetForm()
    router.refresh()
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden mt-4">
      {/* Toggle header */}
      <button
        id="add-score-manually-toggle"
        onClick={() => { setOpen((o) => !o); setError(null); setSuccess(null) }}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[oklch(0.62_0.22_265/0.04)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.62_0.22_265/0.12)] flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Add Score Manually</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Enter a student&apos;s marks directly without uploading a CSV
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        }
      </button>

      {/* Expandable form */}
      {open && (
        <div className="border-t border-[var(--border)] px-5 py-5">

          {/* Success banner */}
          {success && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-start gap-2 mb-4">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Roll No */}
            <div className="space-y-1.5">
              <label htmlFor="manual-roll-no" className="text-sm font-medium">
                Roll Number <span className="text-red-400">*</span>
              </label>
              <input
                id="manual-roll-no"
                type="text"
                required
                placeholder="e.g. 101"
                value={rollNo}
                onChange={(e) => { setRollNo(e.target.value); setError(null); setSuccess(null) }}
                className={inputCls}
              />
            </div>

            {/* Subject marks grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subjects.map((s) => {
                const val = Number(marks[s.name] ?? 0)
                const over = s.max_marks > 0 && val > s.max_marks && marks[s.name] !== ''
                return (
                  <div key={s.name} className="space-y-1.5">
                    <label htmlFor={`manual-mark-${s.name}`} className="text-sm font-medium capitalize flex items-center justify-between">
                      <span>{s.name} <span className="text-red-400">*</span></span>
                      {s.max_marks > 0 && (
                        <span className="text-[10px] text-[var(--muted-foreground)] font-normal">
                          max {s.max_marks}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id={`manual-mark-${s.name}`}
                        type="number"
                        required
                        min={0}
                        max={s.max_marks > 0 ? s.max_marks : undefined}
                        placeholder="0"
                        value={marks[s.name] ?? ''}
                        onChange={(e) => {
                          setMarks((prev) => ({ ...prev, [s.name]: e.target.value }))
                          setError(null)
                          setSuccess(null)
                        }}
                        className={over ? inputOverCls : inputCls}
                      />
                      {s.max_marks > 0 && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted-foreground)] pointer-events-none">
                          /{s.max_marks}
                        </span>
                      )}
                    </div>
                    {over && (
                      <p className="text-[10px] text-red-400">Exceeds max ({s.max_marks})</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Live total preview */}
            {subjects.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[oklch(0.62_0.22_265/0.06)] border border-[oklch(0.62_0.22_265/0.15)] text-xs text-[var(--muted-foreground)]">
                <span>Total preview:</span>
                <span className={`font-bold text-sm ${liveTotal > maxMarks ? 'text-red-400' : 'text-[var(--foreground)]'}`}>
                  {liveTotal}
                </span>
                <span>/ {maxMarks}</span>
                <span className="ml-auto font-medium">
                  {maxMarks > 0 ? `${((liveTotal / maxMarks) * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setOpen(false); resetForm() }}
                className="flex-1 py-2.5 px-4 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
              >
                Cancel
              </button>
              <button
                id="add-score-submit"
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 glow-primary"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Save Score</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
