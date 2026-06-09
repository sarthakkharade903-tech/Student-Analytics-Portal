'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recalculateTestStats } from '@/lib/scoring'
import {
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface BatchGraderProps {
  testId: string
  subjects: string[]
  maxMarks: number
  targetBatches: string[]
  coachingCenterId: string
}

interface GraderRow {
  studentId: string
  rollNo: string
  name: string
  isAbsent: boolean
  marks: Record<string, string> // subject key → value; or '__total__' if no subjects
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL_KEY = '__total__'

const inputCls =
  'w-full px-2 py-1.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all text-sm text-center disabled:opacity-40 disabled:cursor-not-allowed'

// ── Component ─────────────────────────────────────────────────────────────────

export default function BatchGrader({
  testId,
  subjects,
  maxMarks,
  targetBatches,
  coachingCenterId,
}: BatchGraderProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState('')
  const [rows, setRows] = useState<GraderRow[]>([])
  const [alreadyScoredCount, setAlreadyScoredCount] = useState(0)
  const [fetchingStudents, setFetchingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const markFields = subjects.length > 0 ? subjects : [TOTAL_KEY]

  // ── Helpers ────────────────────────────────────────────────────────────────

  const calcRowTotal = (marks: Record<string, string>): number => {
    if (subjects.length === 0) {
      return Number(marks[TOTAL_KEY] ?? 0) || 0
    }
    return subjects.reduce((sum, s) => sum + (Number(marks[s] ?? 0) || 0), 0)
  }

  // ── Load students for a batch ──────────────────────────────────────────────

  const loadBatch = useCallback(async (batch: string) => {
    if (!batch) { setRows([]); return }
    setFetchingStudents(true)
    setError(null)
    setSuccess(null)
    setRows([])

    const supabase = createClient()

    // 1. Fetch students in this batch
    const { data: students, error: stuErr } = await supabase
      .from('students')
      .select('id, name, roll_no')
      .eq('coaching_center_id', coachingCenterId)
      .eq('batch', batch)
      .order('roll_no', { ascending: true })

    if (stuErr || !students) {
      setError('Failed to load students. Please try again.')
      setFetchingStudents(false)
      return
    }

    // 2. Fetch existing scores for this test
    const { data: existing } = await supabase
      .from('scores')
      .select('student_id')
      .eq('test_id', testId)

    const scoredIds = new Set((existing ?? []).map((e: { student_id: string }) => e.student_id))
    const alreadyCount = students.filter((s: { id: string }) => scoredIds.has(s.id)).length
    setAlreadyScoredCount(alreadyCount)

    // 3. Only include unscored students in the grid
    const unscoredStudents = students.filter((s: { id: string }) => !scoredIds.has(s.id))

    const initialRows: GraderRow[] = unscoredStudents.map((s: { id: string; name: string | null; roll_no: string | null }) => ({
      studentId: s.id,
      rollNo: s.roll_no ?? '',
      name: s.name ?? '',
      isAbsent: false,
      marks: {},
    }))

    setRows(initialRows)
    setFetchingStudents(false)
  }, [testId, coachingCenterId])

  const handleBatchChange = (batch: string) => {
    setSelectedBatch(batch)
    loadBatch(batch)
  }

  // ── Row updaters ──────────────────────────────────────────────────────────

  const toggleAbsent = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) => i === idx ? { ...r, isAbsent: !r.isAbsent } : r)
    )
  }

  const setMark = (idx: number, field: string, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => i === idx ? { ...r, marks: { ...r.marks, [field]: value } } : r)
    )
  }

  // ── Quick actions ─────────────────────────────────────────────────────────

  const markAllPresent = () =>
    setRows((prev) => prev.map((r) => ({ ...r, isAbsent: false })))

  const markRemainingAbsent = () =>
    setRows((prev) =>
      prev.map((r) => {
        const total = calcRowTotal(r.marks)
        // Only flip to absent if no marks entered yet
        if (!r.isAbsent && total === 0) return { ...r, isAbsent: true }
        return r
      })
    )

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    if (rows.length === 0) {
      setError('No students to save. All students in this batch may already have scores.')
      return
    }

    // Validate present rows
    for (const row of rows) {
      if (row.isAbsent) continue
      const total = calcRowTotal(row.marks)
      if (total > maxMarks) {
        setError(`${row.name} has total ${total} which exceeds max marks ${maxMarks}.`)
        return
      }
      for (const field of markFields) {
        const val = row.marks[field] ?? ''
        if (val === '') {
          const label = field === TOTAL_KEY ? 'Total' : field
          setError(`Marks for ${row.name} (${label}) are missing.`)
          return
        }
      }
    }

    setSaving(true)
    const supabase = createClient()

    const records = rows.map((row) => {
      const subjectScores: Record<string, number> = {}
      let total = 0
      if (subjects.length > 0) {
        subjects.forEach((s) => {
          const v = Number(row.marks[s] ?? 0)
          subjectScores[s] = v
          total += v
        })
      } else {
        total = Number(row.marks[TOTAL_KEY] ?? 0)
      }
      const percentage = parseFloat(((total / maxMarks) * 100).toFixed(2))

      return {
        test_id: testId,
        student_id: row.studentId,
        subject_scores: subjectScores,
        total: row.isAbsent ? 0 : total,
        percentage: row.isAbsent ? 0 : percentage,
        rank: null,
        is_absent: row.isAbsent,
      }
    })

    // Bulk insert in batches of 50
    const BATCH_SIZE = 50
    const errors: string[] = []
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const { error: insErr } = await supabase
        .from('scores')
        .insert(records.slice(i, i + BATCH_SIZE))
      if (insErr) errors.push(insErr.message)
    }

    if (errors.length > 0) {
      setError(`Some scores failed to save: ${errors[0]}`)
      setSaving(false)
      return
    }

    // Recalculate ranks + aggregates
    await recalculateTestStats(supabase, testId)

    const presentCount = records.filter((r) => !r.is_absent).length
    const absentCount = records.filter((r) => r.is_absent).length
    setSuccess(
      `Saved ${presentCount} present score${presentCount !== 1 ? 's' : ''}` +
      (absentCount > 0 ? ` and ${absentCount} absent mark${absentCount !== 1 ? 's' : ''}` : '') +
      `. Ranks recalculated.`
    )

    // Reset grader so already-saved students disappear
    setSaving(false)
    await loadBatch(selectedBatch)
    router.refresh()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const presentCount = rows.filter((r) => !r.isAbsent).length
  const absentCount = rows.filter((r) => r.isAbsent).length

  // Column template: Roll | Name | Status | ...subjects or total | Total
  const subjectCols = subjects.length > 0
    ? `repeat(${subjects.length}, 72px)`
    : '100px'
  const colTemplate = `80px 1fr 110px ${subjectCols} 80px`

  return (
    <div className="glass-card rounded-2xl overflow-hidden mt-4">
      {/* Toggle header */}
      <button
        id="batch-grader-toggle"
        onClick={() => { setOpen((o) => !o); setError(null); setSuccess(null) }}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[oklch(0.62_0.22_265/0.04)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[oklch(0.70_0.15_180/0.12)] flex items-center justify-center">
            <Users className="w-4 h-4 text-[oklch(0.70_0.15_180)]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Batch Grader</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Select a batch and enter marks for all students at once
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-[var(--border)]">

          {/* Batch selector + quick actions */}
          <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.4)]">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <label htmlFor="batch-select" className="text-sm font-medium whitespace-nowrap">
                Select Batch:
              </label>
              <select
                id="batch-select"
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
              >
                <option value="">— Choose a batch —</option>
                {targetBatches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {rows.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  id="mark-all-present"
                  type="button"
                  onClick={markAllPresent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-500/10 text-green-400 border border-green-500/25 hover:bg-green-500/20 transition-all"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark All Present
                </button>
                <button
                  id="mark-remaining-absent"
                  type="button"
                  onClick={markRemainingAbsent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Mark Remaining Absent
                </button>
              </div>
            )}
          </div>

          {/* Success / Error banners */}
          <div className="px-5 pt-3 space-y-2">
            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>

          {/* Loading state */}
          {fetchingStudents && (
            <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted-foreground)] text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading students…
            </div>
          )}

          {/* No batch selected */}
          {!fetchingStudents && !selectedBatch && (
            <div className="py-12 text-center text-sm text-[var(--muted-foreground)]">
              Select a batch above to load students.
            </div>
          )}

          {/* All already scored */}
          {!fetchingStudents && selectedBatch && rows.length === 0 && alreadyScoredCount > 0 && (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-medium text-green-400">All {alreadyScoredCount} students in this batch already have scores.</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Use the delete button in the table above to remove a score and re-enter it.</p>
            </div>
          )}

          {/* Grid */}
          {!fetchingStudents && rows.length > 0 && (
            <>
              {/* Info row */}
              <div className="px-5 pt-3 pb-2 flex items-center gap-4 flex-wrap">
                <span className="text-xs text-[var(--muted-foreground)]">
                  <span className="font-semibold text-[var(--foreground)]">{rows.length}</span> student{rows.length !== 1 ? 's' : ''} to grade
                  {alreadyScoredCount > 0 && <span className="ml-2 text-yellow-400">· {alreadyScoredCount} already scored (hidden)</span>}
                </span>
                <span className="text-xs text-[var(--muted-foreground)] ml-auto">
                  <span className="text-green-400 font-medium">{presentCount} present</span>
                  {absentCount > 0 && <span className="text-red-400 font-medium ml-2">{absentCount} absent</span>}
                </span>
              </div>

              {/* Header row */}
              <div
                className="grid gap-2 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.4)]"
                style={{ gridTemplateColumns: colTemplate }}
              >
                <span>Roll No</span>
                <span>Name</span>
                <span className="text-center">Status</span>
                {subjects.length > 0
                  ? subjects.map((s) => <span key={s} className="text-center capitalize">{s}</span>)
                  : <span className="text-center">Total Marks</span>
                }
                <span className="text-center">Total</span>
              </div>

              {/* Student rows */}
              <div className="divide-y divide-[var(--border)] max-h-[520px] overflow-y-auto">
                {rows.map((row, idx) => {
                  const rowTotal = row.isAbsent ? 0 : calcRowTotal(row.marks)
                  const rowPct = maxMarks > 0 ? ((rowTotal / maxMarks) * 100).toFixed(1) : '0.0'

                  return (
                    <div
                      key={row.studentId}
                      className={`grid gap-2 px-5 py-2.5 items-center transition-colors ${
                        row.isAbsent
                          ? 'bg-red-500/5 opacity-70'
                          : idx % 2 !== 0
                          ? 'bg-[oklch(0.10_0.01_240/0.25)]'
                          : ''
                      }`}
                      style={{ gridTemplateColumns: colTemplate }}
                    >
                      {/* Roll No */}
                      <span className="font-mono text-xs text-[var(--primary)] bg-[oklch(0.62_0.22_265/0.1)] px-2 py-0.5 rounded-md inline-block text-center">
                        {row.rollNo}
                      </span>

                      {/* Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold text-[var(--primary)]">
                            {row.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium truncate">{row.name}</span>
                      </div>

                      {/* Status toggle */}
                      <div className="flex justify-center">
                        <button
                          id={`toggle-absent-${row.studentId}`}
                          type="button"
                          onClick={() => toggleAbsent(idx)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            row.isAbsent
                              ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                              : 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25'
                          }`}
                        >
                          {row.isAbsent ? (
                            <><XCircle className="w-3 h-3" /> Absent</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3" /> Present</>
                          )}
                        </button>
                      </div>

                      {/* Mark inputs */}
                      {markFields.map((field) => (
                        <input
                          key={field}
                          id={`mark-${row.studentId}-${field}`}
                          type="number"
                          min={0}
                          max={maxMarks}
                          disabled={row.isAbsent}
                          placeholder="0"
                          value={row.marks[field] ?? ''}
                          onChange={(e) => setMark(idx, field, e.target.value)}
                          className={inputCls}
                        />
                      ))}

                      {/* Auto total */}
                      <div className="text-center">
                        {row.isAbsent ? (
                          <span className="text-xs text-red-400 font-medium">—</span>
                        ) : (
                          <div>
                            <span className={`text-sm font-bold ${rowTotal > maxMarks ? 'text-red-400' : 'text-[var(--foreground)]'}`}>
                              {rowTotal}
                            </span>
                            <span className="text-[10px] text-[var(--muted-foreground)] block leading-none mt-0.5">{rowPct}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Save bar */}
              <div className="px-5 py-4 border-t border-[var(--border)] bg-[oklch(0.10_0.01_240/0.4)] flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Max marks per student: <span className="font-semibold text-[var(--foreground)]">{maxMarks}</span>
                </span>
                <button
                  id="save-batch-scores"
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-primary"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Batch Scores</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
