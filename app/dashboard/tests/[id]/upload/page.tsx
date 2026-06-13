'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import { recalculateTestStats } from '@/lib/scoring'
import { normaliseSubjects } from '@/lib/subjects'
import type { SubjectConfig } from '@/lib/types'
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  RefreshCw,
  ClipboardList,
  Ban,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestInfo {
  id: string
  test_name: string
  subjects: SubjectConfig[]
  target_batches: string[]
  max_marks: number
  standard?: string
}

interface StudentRecord {
  id: string
  roll_no: string
  name: string
}

interface ValidatedRow {
  rowIndex: number
  roll_no: string
  subject_scores: Record<string, number>
  total: number
  student: StudentRecord | null
  errors: string[]
  isValid: boolean
}

interface ImportSummary {
  total: number
  imported: number
  failed: number
  errors: string[]
}

type Step = 'upload' | 'preview' | 'importing' | 'done' | 'blocked'

// ── Rank calculation (dense ranking — ties get same rank) ─────────────────────

function assignRanks(rows: ValidatedRow[]): Array<ValidatedRow & { rank: number }> {
  const sorted = [...rows].sort((a, b) => b.total - a.total)
  let rank = 1
  return sorted.map((row, idx) => {
    if (idx > 0 && row.total < sorted[idx - 1].total) {
      rank = idx + 1
    }
    return { ...row, rank }
  })
}

// ── Header normalizer ────────────────────────────────────────────────────────
// Used on BOTH the parsed CSV headers and expected subject names so they
// always match, regardless of spacing or casing differences.
//
// Rule: trim → lowercase → collapse runs of whitespace/underscores to a
//       single underscore.  e.g. "CET B" → "cet_b",  "cet_b" → "cet_b"
const normalizeHeader = (h: string) =>
  h.trim().toLowerCase().replace(/[\s_]+/g, '_')

// ── Download template ─────────────────────────────────────────────────────────

function downloadTemplate(testName: string, subjects: SubjectConfig[]) {
  const headers = ['roll_no', ...subjects.map((s) => s.name)].join(',')
  const example1 = ['101', ...subjects.map((_, i) => String(70 + i * 5))].join(',')
  const example2 = ['102', ...subjects.map((_, i) => String(80 + i * 3))].join(',')
  const csv = [headers, example1, example2].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${testName.replace(/\s+/g, '_')}_marks_template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function UploadResultsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const testId = params.id

  // ── State ──────────────────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')

  const [test, setTest] = useState<TestInfo | null>(null)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [coachingCenterId, setCoachingCenterId] = useState<string | null>(null)

  const [rows, setRows] = useState<ValidatedRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ── Load test + students on mount ──────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()

      // Auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Profile
      const { data: profile } = await supabase
        .from('users')
        .select('coaching_center_id')
        .eq('id', user.id)
        .single()

      if (!profile?.coaching_center_id) return
      setCoachingCenterId(profile.coaching_center_id)

      // Test info
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('id, test_name, subjects, target_batches, max_marks, standard')
        .eq('id', testId)
        .eq('coaching_center_id', profile.coaching_center_id)
        .single()

      if (testError || !testData) {
        setLoadError('Test not found or you do not have access to it.')
        return
      }
      
      const normalisedSubjects = normaliseSubjects(testData.subjects)
      setTest({ ...testData, subjects: normalisedSubjects } as TestInfo)

      // Check if scores already exist (Option A — block re-upload)
      const { count: existingCount } = await supabase
        .from('scores')
        .select('id', { count: 'exact', head: true })
        .eq('test_id', testId)

      if (existingCount && existingCount > 0) {
        setStep('blocked')
        return
      }

      // Load all students for the target batches (for roll_no lookup & absent tracking)
      let query = supabase
        .from('students')
        .select('id, roll_no, name')
        .eq('coaching_center_id', profile.coaching_center_id)
        .eq('standard', testData.standard)

      if (testData.target_batches && testData.target_batches.length > 0) {
        query = query.in('batch', testData.target_batches)
      }

      const { data: studentData } = await query

      setStudents((studentData ?? []) as StudentRecord[])
    }

    load()
  }, [testId])

  // ── Validate CSV rows ──────────────────────────────────────────────────────
  // `raw`         – rows from PapaParse (keys are already normalizeHeader'd)
  // `subjects`    – original subject names from the DB (e.g. "cet b")
  // `subjectMap`  – normalizedKey → originalSubjectName

  const validateRows = useCallback(
    (
      raw: Record<string, string>[],
      subjects: SubjectConfig[],
      subjectMap: Map<string, string>
    ): ValidatedRow[] => {
      const studentMap = new Map(students.map((s) => [s.roll_no.trim().toLowerCase(), s]))
      const seenRolls = new Map<string, number>()

      return raw.map((row, idx) => {
        const roll_no = (row['roll_no'] ?? '').trim()
        const errors: string[] = []
        // Store scores under ORIGINAL subject name (e.g. "cet b") for DB
        const subject_scores: Record<string, number> = {}

        // Track duplicates within file
        const rollKey = roll_no.toLowerCase()
        seenRolls.set(rollKey, (seenRolls.get(rollKey) ?? 0) + 1)

        if (!roll_no) {
          errors.push('Roll number is missing')
        }

        let total = 0
        for (const subject of subjects) {
          const originalSubject = subject.name
          const normKey = normalizeHeader(originalSubject)
          const raw_val = (row[normKey] ?? '').trim()
          if (raw_val === '') {
            errors.push(`Missing marks for ${originalSubject}`)
          } else {
            const num = Number(raw_val)
            if (isNaN(num)) {
              errors.push(`${originalSubject} marks must be numeric`)
            } else if (subject.max_marks > 0 && num > subject.max_marks) {
              errors.push(`${originalSubject} marks (${num}) exceed max (${subject.max_marks})`)
            } else {
              // Key in subject_scores uses original name, not normalized key
              subject_scores[originalSubject] = num
              total += num
            }
          }
        }

        const student = roll_no ? (studentMap.get(roll_no.toLowerCase()) ?? null) : null
        if (roll_no && !student) {
          errors.push(`Roll No. ${roll_no} not found in students`)
        }

        return {
          rowIndex: idx + 1,
          roll_no,
          subject_scores,
          total,
          student,
          errors,
          isValid: errors.length === 0,
        }
      }).map((row) => {
        // Mark duplicates as invalid after the full pass
        const rollKey = row.roll_no.toLowerCase()
        if ((seenRolls.get(rollKey) ?? 0) > 1 && row.roll_no) {
          return {
            ...row,
            isValid: false,
            errors: [...row.errors.filter(e => !e.includes('Duplicate')), 'Duplicate roll number in file'],
          }
        }
        return row
      })
    },
    [students]
  )

  // ── Parse CSV ──────────────────────────────────────────────────────────────

  const parseFile = useCallback(
    (file: File) => {
      if (!test) return
      setParseError(null)

      if (!file.name.endsWith('.csv')) {
        setParseError('Only CSV files are accepted. Please upload a .csv file.')
        return
      }

      setFileName(file.name)

      // Build normalizedKey → originalSubject map once
      // e.g. "cet b" → normKey "cet_b", so CSV header "cet b" or "CET B" all match
      const subjectMap = new Map(test.subjects.map((s) => [normalizeHeader(s.name), s.name]))
      const normalizedExpected = ['roll_no', ...test.subjects.map(s => normalizeHeader(s.name))]

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        // Normalize every CSV header with the SAME function
        transformHeader: normalizeHeader,
        complete: (result) => {
          const cols = result.meta.fields ?? []

          console.log('[CSV Upload] Expected columns:', normalizedExpected)
          console.log('[CSV Upload] Actual parsed columns:', cols)

          // Find any expected normalized column that is absent in parsed cols
          const missing = normalizedExpected.filter((c) => !cols.includes(c))
          if (missing.length > 0) {
            // Show original names in error for readability
            const missingOriginal = missing.map(
              (norm) => subjectMap.get(norm) ?? norm
            )
            setParseError(
              `CSV is missing columns: ${missingOriginal.join(', ')}.\n` +
              `Expected: roll_no, ${test.subjects.map(s => s.name).join(', ')}`
            )
            return
          }

          if (result.data.length === 0) {
            setParseError('The CSV file is empty. Please add at least one row of marks.')
            return
          }

          const validated = validateRows(result.data, test.subjects, subjectMap)
          setRows(validated)
          setStep('preview')
        },
        error: (err) => {
          setParseError(`Failed to parse CSV: ${err.message}`)
        },
      })
    },
    [test, validateRows]
  )

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) parseFile(file)
    },
    [parseFile]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!coachingCenterId || !test) return
    const validRows = rows.filter((r) => r.isValid)
    if (validRows.length === 0) return

    setStep('importing')
    const supabase = createClient()

    // Calculate ranks
    const rankedRows = assignRanks(validRows)

    // Build score records (present students)
    const scoreRecords = rankedRows.map((row) => ({
      test_id: testId,
      student_id: row.student!.id,
      subject_scores: row.subject_scores,
      total: row.total,
      percentage: parseFloat(((row.total / test.max_marks) * 100).toFixed(2)),
      rank: row.rank,
      is_absent: false,
    }))

    // Find absent students
    const presentStudentIds = new Set(rankedRows.map((r) => r.student!.id))
    const absentRecords = students
      .filter((s) => !presentStudentIds.has(s.id))
      .map((s) => ({
        test_id: testId,
        student_id: s.id,
        subject_scores: {},
        total: 0,
        percentage: 0,
        rank: null,
        is_absent: true,
      }))

    const allRecords = [...scoreRecords, ...absentRecords]

    // Batch insert scores
    let imported = 0
    const failedErrors: string[] = []
    const BATCH_SIZE = 50

    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('scores').insert(batch)
      if (error) {
        failedErrors.push(error.message)
      } else {
        imported += batch.length
      }
    }

    // Update test aggregates (centralized engine)
    if (scoreRecords.length > 0) {
      await recalculateTestStats(supabase, testId)
    }

    setSummary({
      total: rows.length + absentRecords.length,
      imported: allRecords.length - failedErrors.length,
      failed: rows.filter((r) => !r.isValid).length + failedErrors.length,
      errors: failedErrors,
    })
    setStep('done')
    router.refresh()
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const validCount = rows.filter((r) => r.isValid).length
  const invalidCount = rows.filter((r) => !r.isValid).length

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/tests"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tests
        </Link>
        <div className="glass-card rounded-2xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p className="text-[var(--muted-foreground)] text-sm">{loadError}</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href={`/dashboard/tests/${testId}?std=${test?.standard || '11th'}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Test Details
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
          <Upload className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Upload Results</h1>
          {test && (
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              {test.test_name}
              <span className="text-[var(--border)]">·</span>
              Subjects: <span className="capitalize">{test.subjects.map(s => s.name).join(', ')}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── BLOCKED: scores already exist ──────────────────────────────────── */}
      {step === 'blocked' && (
        <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
            <Ban className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Results Already Uploaded</h2>
          <p className="text-[var(--muted-foreground)] text-sm max-w-md mb-6">
            This test already has student scores. Re-uploading is not allowed to protect existing data.
            If you need to make corrections, please create a new test instead.
          </p>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/tests/${testId}?std=${test?.standard || '11th'}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
            >
              View Results
            </Link>
            <Link
              href="/dashboard/tests/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all glow-primary"
            >
              Create New Test
            </Link>
          </div>
        </div>
      )}

      {/* ── UPLOAD ─────────────────────────────────────────────────────────── */}
      {step === 'upload' && test && (
        <div className="space-y-6">
          {/* Template download */}
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[oklch(0.62_0.22_265/0.1)] flex items-center justify-center flex-shrink-0">
                <FileText className="w-[18px] h-[18px] text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-sm font-medium">Download Template</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Pre-filled CSV template for <span className="capitalize">{test.subjects.map(s => s.name).join(', ')}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadTemplate(test.test_name, test.subjects)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all whitespace-nowrap flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          {/* Drag & Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
              isDragging
                ? 'border-[var(--primary)] bg-[oklch(0.62_0.22_265/0.08)]'
                : 'border-[var(--border)] hover:border-[oklch(0.62_0.22_265/0.5)] hover:bg-[oklch(0.62_0.22_265/0.04)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              isDragging ? 'bg-[oklch(0.62_0.22_265/0.2)]' : 'bg-[oklch(0.62_0.22_265/0.1)]'
            }`}>
              <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
            </div>
            <p className="font-semibold mb-1">
              {isDragging ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">or click to browse files</p>
            <span className="text-xs px-3 py-1 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
              .csv files only
            </span>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{parseError}</span>
            </div>
          )}

          {/* Expected format */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Expected CSV Format
            </p>
            <div className="rounded-lg bg-[oklch(0.08_0.01_240)] border border-[var(--border)] p-3 font-mono text-xs text-[var(--muted-foreground)] overflow-x-auto">
              <p className="text-[var(--primary)]">roll_no,{test.subjects.map(s => s.name).join(',')}</p>
              <p>101,{test.subjects.map((_, i) => 70 + i * 5).join(',')}</p>
              <p>102,{test.subjects.map((_, i) => 80 + i * 3).join(',')}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                roll_no — required, must match a student
              </span>
              {test.subjects.map((s) => (
                <span key={s.name} className="flex items-center gap-1 capitalize">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  {s.name} — numeric {s.max_marks > 0 ? `(max ${s.max_marks})` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW ────────────────────────────────────────────────────────── */}
      {step === 'preview' && test && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold mb-1">{rows.length}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Total Rows</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center border border-green-500/20">
              <p className="text-3xl font-bold text-green-400 mb-1">{validCount}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Ready to Import</p>
            </div>
            <div className={`glass-card rounded-2xl p-5 text-center ${invalidCount > 0 ? 'border border-red-500/20' : ''}`}>
              <p className={`text-3xl font-bold mb-1 ${invalidCount > 0 ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>
                {invalidCount}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">Invalid Rows</p>
            </div>
          </div>

          {/* File info + re-upload */}
          <div className="glass-card rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{rows.length} rows parsed</p>
              </div>
            </div>
            <button
              onClick={() => { setStep('upload'); setRows([]); setFileName(''); setParseError(null) }}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-upload
            </button>
          </div>

          {/* Preview table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.5)] flex items-center justify-between">
              <p className="text-sm font-semibold">Preview</p>
              <p className="text-xs text-[var(--muted-foreground)]">Review before importing</p>
            </div>

            {/* Column headers */}
            <div
              className="grid gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.3)]"
              style={{ gridTemplateColumns: `40px 80px 80px 1fr repeat(${test.subjects.length}, 70px) 70px 1fr` }}
            >
              {['#', 'Status', 'Roll No.', 'Student', ...test.subjects.map(s => s.name.substring(0, 4)), 'Total', 'Errors'].map((h, i) => (
                <span key={`${h}-${i}`} className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] capitalize">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--border)] max-h-[420px] overflow-y-auto">
              {rows.map((row) => (
                <div
                  key={row.rowIndex}
                  className={`grid gap-3 px-5 py-3 items-center text-sm ${row.isValid ? '' : 'bg-red-500/5'}`}
                  style={{ gridTemplateColumns: `40px 80px 80px 1fr repeat(${test.subjects.length}, 70px) 70px 1fr` }}
                >
                  <span className="text-xs text-[var(--muted-foreground)]">{row.rowIndex}</span>
                  <span>
                    {row.isValid
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                    }
                  </span>
                  <span className={`font-mono text-xs ${!row.roll_no ? 'text-red-400 italic' : 'text-[var(--primary)]'}`}>
                    {row.roll_no || '(empty)'}
                  </span>
                  <span className={`text-sm truncate ${!row.student ? 'text-red-400 italic' : 'font-medium'}`}>
                    {row.student?.name ?? (row.roll_no ? 'Not found' : '—')}
                  </span>
                  {test.subjects.map((s) => (
                    <span key={s.name} className="text-xs text-center text-[var(--muted-foreground)]">
                      {row.subject_scores[s.name] ?? <span className="text-red-400">—</span>}
                    </span>
                  ))}
                  <span className="text-xs text-center font-semibold">{row.total || '—'}</span>
                  <span className="text-xs text-red-400 truncate">
                    {row.isValid ? <span className="text-green-400">Valid ✓</span> : row.errors.join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {validCount === 0 ? (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 text-sm text-yellow-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              No valid rows found. Please fix the errors in your CSV and re-upload.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              {invalidCount > 0 && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
                  {invalidCount} invalid row{invalidCount > 1 ? 's' : ''} will be skipped.
                </p>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => { setStep('upload'); setRows([]); setFileName('') }}
                  className="px-4 py-2.5 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
                >
                  Cancel
                </button>
                <button
                  id="confirm-import-btn"
                  onClick={handleImport}
                  disabled={!coachingCenterId}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all glow-primary"
                >
                  Import {validCount} Result{validCount > 1 ? 's' : ''}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── IMPORTING ──────────────────────────────────────────────────────── */}
      {step === 'importing' && (
        <div className="glass-card rounded-2xl py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-5" />
          <h3 className="text-lg font-semibold mb-2">Importing results…</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Calculating ranks and storing {validCount} result{validCount > 1 ? 's' : ''}. Please wait.
          </p>
        </div>
      )}

      {/* ── DONE ───────────────────────────────────────────────────────────── */}
      {step === 'done' && summary && (
        <div className="space-y-6">
          {/* Result cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold mb-1">{summary.total}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Total Rows</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center border border-green-500/30">
              <p className="text-3xl font-bold text-green-400 mb-1">{summary.imported}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Successfully Imported</p>
            </div>
            <div className={`glass-card rounded-2xl p-5 text-center ${summary.failed > 0 ? 'border border-red-500/20' : ''}`}>
              <p className={`text-3xl font-bold mb-1 ${summary.failed > 0 ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>
                {summary.failed}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">Skipped / Failed</p>
            </div>
          </div>

          {/* Success card */}
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {summary.imported} result{summary.imported !== 1 ? 's' : ''} imported!
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-6">
              {summary.failed > 0
                ? `${summary.failed} row${summary.failed > 1 ? 's were' : ' was'} skipped due to validation errors.`
                : 'All valid marks have been saved. Absent students have been marked correctly.'}
            </p>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/tests/${testId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all glow-primary"
              >
                <ClipboardList className="w-4 h-4" />
                View Results
              </Link>
            </div>
          </div>

          {/* DB errors if any */}
          {summary.errors.length > 0 && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              <p className="font-medium mb-1">Database errors:</p>
              {summary.errors.map((e, i) => <p key={i} className="text-xs">{e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
