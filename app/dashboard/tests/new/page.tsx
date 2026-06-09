'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, Loader2, CheckCircle2, ClipboardList } from 'lucide-react'

// ── Preset subject groups ─────────────────────────────────────────────────────

const PRESETS: Record<string, string[]> = {
  PCM: ['physics', 'chemistry', 'maths'],
  PCB: ['physics', 'chemistry', 'biology'],
  Physics: ['physics'],
  Chemistry: ['chemistry'],
  Maths: ['maths'],
}

const BATCH_PRESETS = ['JEE', 'NEET', 'CET A', 'CET B']

const TEST_TYPES = [
  'Weekly Test',
  'Subject Test',
  'Grand Test',
  'Mock Exam',
  'Revision Test',
  'Unit Test',
  'Custom Test'
]

// ── Input class helper ────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm'

// ─────────────────────────────────────────────────────────────────────────────

export default function CreateTestPage() {
  const router = useRouter()
  const [coachingCenterId, setCoachingCenterId] = useState<string | null>(null)
  const [testName, setTestName] = useState('')
  const [testDate, setTestDate] = useState('')
  const [testType, setTestType] = useState('Weekly Test')
  const [maxMarks, setMaxMarks] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [subjectInput, setSubjectInput] = useState('')
  const [targetBatches, setTargetBatches] = useState<string[]>([])
  const [batchInput, setBatchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch coaching_center_id on mount
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('users')
        .select('coaching_center_id')
        .eq('id', user.id)
        .single()
      if (profile?.coaching_center_id) setCoachingCenterId(profile.coaching_center_id)
    }
    load()
  }, [])

  // ── Subject helpers ───────────────────────────────────────────────────────

  const addSubject = (name: string) => {
    const cleaned = name.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!cleaned) return
    if (subjects.includes(cleaned)) return
    setSubjects((prev) => [...prev, cleaned])
  }

  const removeSubject = (name: string) => {
    setSubjects((prev) => prev.filter((s) => s !== name))
  }

  const applyPreset = (key: string) => {
    setSubjects(PRESETS[key])
  }

  const handleSubjectKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSubject(subjectInput)
      setSubjectInput('')
    }
    if (e.key === 'Backspace' && subjectInput === '' && subjects.length > 0) {
      setSubjects((prev) => prev.slice(0, -1))
    }
  }

  // ── Batch helpers ─────────────────────────────────────────────────────────

  const addBatch = (name: string) => {
    const cleaned = name.trim()
    if (!cleaned) return
    // Case-insensitive check
    if (targetBatches.some(b => b.toLowerCase() === cleaned.toLowerCase())) return
    setTargetBatches((prev) => [...prev, cleaned])
  }

  const removeBatch = (name: string) => {
    setTargetBatches((prev) => prev.filter((b) => b !== name))
  }

  const handleBatchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addBatch(batchInput)
      setBatchInput('')
    }
    if (e.key === 'Backspace' && batchInput === '' && targetBatches.length > 0) {
      setTargetBatches((prev) => prev.slice(0, -1))
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!coachingCenterId) {
      setError('Could not load institute data. Please refresh and try again.')
      return
    }
    if (subjects.length === 0) {
      setError('Please add at least one subject.')
      return
    }
    if (targetBatches.length === 0) {
      setError('Please specify at least one target batch.')
      return
    }
    const marks = Number(maxMarks)
    if (!marks || marks <= 0) {
      setError('Max marks must be a positive number.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: insertError } = await supabase.from('tests').insert({
      coaching_center_id: coachingCenterId,
      test_name: testName.trim(),
      test_type: testType,
      test_date: testDate,
      subjects,
      target_batches: targetBatches,
      max_marks: marks,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard/tests')
      router.refresh()
    }, 1200)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/tests"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tests
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create Test</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Set up a new test before uploading student marks.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="glass-card rounded-2xl p-8">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Test created!</h3>
            <p className="text-[var(--muted-foreground)] text-sm">Redirecting to Tests…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Test Name & Type row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="test-name" className="text-sm font-medium">
                  Test Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="test-name"
                  type="text"
                  required
                  placeholder="e.g. Weekly Test – June Week 1"
                  value={testName}
                  onChange={(e) => { setTestName(e.target.value); setError(null) }}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="test-type" className="text-sm font-medium">
                  Test Type <span className="text-red-400">*</span>
                </label>
                <select
                  id="test-type"
                  required
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className={inputCls}
                  style={{ colorScheme: 'dark' }}
                >
                  {TEST_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Test Date */}
            <div className="space-y-1.5">
              <label htmlFor="test-date" className="text-sm font-medium">
                Test Date <span className="text-red-400">*</span>
              </label>
              <input
                id="test-date"
                type="date"
                required
                value={testDate}
                onChange={(e) => { setTestDate(e.target.value); setError(null) }}
                className={inputCls}
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Subjects */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Subjects <span className="text-red-400">*</span>
              </label>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs text-[var(--muted-foreground)] self-center mr-1">Quick select:</span>
                {Object.keys(PRESETS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className="px-3 py-1 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--secondary)] hover:border-[oklch(0.62_0.22_265/0.4)] transition-all"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Tag input area */}
              <div className="min-h-[48px] px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--ring)] transition-all flex flex-wrap gap-2 items-center">
                {subjects.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[oklch(0.62_0.22_265/0.18)] text-[var(--primary)] text-xs font-medium capitalize"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSubject(s)}
                      className="hover:text-red-400 transition-colors ml-0.5"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={subjects.length === 0 ? 'Type a subject, then press Enter…' : 'Add more…'}
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={handleSubjectKeyDown}
                  onBlur={() => { if (subjectInput.trim()) { addSubject(subjectInput); setSubjectInput('') } }}
                  className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-[var(--muted-foreground)]"
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Press <kbd className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[10px] font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[10px] font-mono">,</kbd> to add a subject
              </p>
            </div>

            {/* Target Batches */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Target Batches <span className="text-red-400">*</span>
              </label>

              {/* Quick batch presets */}
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs text-[var(--muted-foreground)] self-center mr-1">Quick select:</span>
                {BATCH_PRESETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => addBatch(b)}
                    className="px-3 py-1 rounded-lg border border-[var(--border)] text-xs font-medium hover:bg-[var(--secondary)] hover:border-[oklch(0.62_0.22_265/0.4)] transition-all"
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Batch tag input area */}
              <div className="min-h-[48px] px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--ring)] transition-all flex flex-wrap gap-2 items-center">
                {targetBatches.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[oklch(0.62_0.22_265/0.18)] text-[var(--primary)] text-xs font-medium"
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => removeBatch(b)}
                      className="hover:text-red-400 transition-colors ml-0.5"
                      aria-label={`Remove ${b}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={targetBatches.length === 0 ? 'Type a batch name, then press Enter…' : 'Add more…'}
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  onKeyDown={handleBatchKeyDown}
                  onBlur={() => { if (batchInput.trim()) { addBatch(batchInput); setBatchInput('') } }}
                  className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-[var(--muted-foreground)]"
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Press <kbd className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[10px] font-mono">Enter</kbd> to add a batch. Only students in these batches will be tracked.
              </p>
            </div>

            {/* Max Marks */}
            <div className="space-y-1.5">
              <label htmlFor="max-marks" className="text-sm font-medium">
                Max Marks (Total) <span className="text-red-400">*</span>
              </label>
              <input
                id="max-marks"
                type="number"
                required
                min={1}
                placeholder="e.g. 300 for a 3-subject test with 100 each"
                value={maxMarks}
                onChange={(e) => { setMaxMarks(e.target.value); setError(null) }}
                className={inputCls}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Total possible score across all subjects.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard/tests"
                className="flex-1 py-2.5 px-4 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all text-center"
              >
                Cancel
              </Link>
              <button
                id="create-test-submit"
                type="submit"
                disabled={loading || !coachingCenterId}
                className="flex-1 py-2.5 px-4 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 glow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Test
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
