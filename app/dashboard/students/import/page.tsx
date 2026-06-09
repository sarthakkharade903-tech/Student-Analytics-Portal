'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Users,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawRow {
  roll_no?: string
  name?: string
  parent_phone?: string
  batch?: string
  [key: string]: string | undefined
}

interface ValidatedRow {
  rowIndex: number
  roll_no: string
  name: string
  parent_phone: string
  batch: string
  errors: string[]
  isValid: boolean
  isDuplicate: boolean
}

interface ImportSummary {
  total: number
  imported: number
  failed: number
  errors: string[]
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

// ─── Constants ───────────────────────────────────────────────────────────────

const TEMPLATE_CSV = `roll_no,name,parent_phone,batch\n101,Rohan Sharma,9876543210,JEE\n102,Priya Patel,9123456789,NEET\n103,Arjun Mehta,8765432109,CET A\n104,Sneha Rao,9988776655,CET B`

const REQUIRED_COLUMNS = ['roll_no', 'name']

// ─── Validation ──────────────────────────────────────────────────────────────

function validateRows(raw: RawRow[]): ValidatedRow[] {
  const rollNos: string[] = raw.map((r) => (r.roll_no ?? '').trim().toLowerCase())

  return raw.map((row, idx) => {
    const roll_no = (row.roll_no ?? '').trim()
    const name = (row.name ?? '').trim()
    const parent_phone = (row.parent_phone ?? '').trim()
    const batch = (row.batch ?? '').trim()
    const errors: string[] = []

    if (!roll_no) errors.push('Roll number is required')
    if (!name) errors.push('Name is required')

    if (parent_phone) {
      const digits = parent_phone.replace(/[\s\-+()]/g, '')
      if (!/^\d{10}$/.test(digits) && !/^91\d{10}$/.test(digits)) {
        errors.push('Phone must be 10 digits')
      }
    }

    const dupCount = rollNos.filter((r) => r === roll_no.toLowerCase() && r !== '').length
    if (dupCount > 1 && roll_no) {
      errors.push('Duplicate roll number in file')
    }

    return {
      rowIndex: idx + 1,
      roll_no,
      name,
      parent_phone,
      batch,
      errors,
      isValid: errors.length === 0,
      isDuplicate: false,
    }
  })
}

// ─── Download Template ────────────────────────────────────────────────────────

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'students_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImportStudentsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ValidatedRow[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [coachingCenterId, setCoachingCenterId] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false)
  const [duplicatesChecked, setDuplicatesChecked] = useState(false)

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

  // ── Parse CSV file ─────────────────────────────────────────────────────────

  const parseFile = useCallback((file: File) => {
    setParseError(null)
    if (!file.name.endsWith('.csv')) {
      setParseError('Only CSV files are accepted. Please upload a .csv file.')
      return
    }

    setFileName(file.name)
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (result) => {
        // Check required columns exist
        const cols = result.meta.fields ?? []
        const missing = REQUIRED_COLUMNS.filter((c) => !cols.includes(c))
        if (missing.length > 0) {
          setParseError(
            `Missing required columns: ${missing.join(', ')}. Please use the template.`
          )
          return
        }

        if (result.data.length === 0) {
          setParseError('The CSV file is empty. Please add at least one student row.')
          return
        }

        const validated = validateRows(result.data)
        setRows(validated)
        setStep('preview')
      },
      error: (err) => {
        setParseError(`Failed to parse CSV: ${err.message}`)
      },
    })
  }, [])

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

  // ── Check Duplicates ────────────────────────────────────────────────────────

  const checkAndPreviewDuplicates = async () => {
    if (!coachingCenterId) return
    setIsCheckingDuplicates(true)
    const supabase = createClient()

    // Fetch all existing students for this coaching center
    const { data: existing } = await supabase
      .from('students')
      .select('name, roll_no, parent_phone, batch')
      .eq('coaching_center_id', coachingCenterId)

    const existingSet = new Set(
      (existing ?? []).map((s) =>
        `${s.name?.trim().toLowerCase()}|${s.roll_no?.trim().toLowerCase()}|${(s.parent_phone ?? '').trim()}|${(s.batch ?? '').trim().toLowerCase()}`
      )
    )

    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        isDuplicate:
          row.isValid &&
          existingSet.has(
            `${row.name.trim().toLowerCase()}|${row.roll_no.trim().toLowerCase()}|${row.parent_phone.trim()}|${row.batch.trim().toLowerCase()}`
          ),
      }))
    )
    setIsCheckingDuplicates(false)
    setDuplicatesChecked(true)
  }

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!coachingCenterId) return
    // Only insert rows that are valid AND not duplicates
    const newRows = rows.filter((r) => r.isValid && !r.isDuplicate)
    if (newRows.length === 0) return

    setStep('importing')
    const supabase = createClient()

    const payload = newRows.map((r) => ({
      coaching_center_id: coachingCenterId,
      name: r.name,
      roll_no: r.roll_no,
      parent_phone: r.parent_phone,
      batch: r.batch,
    }))

    // Insert in batches of 50
    let imported = 0
    const failedErrors: string[] = []
    const batchSize = 50
    for (let i = 0; i < payload.length; i += batchSize) {
      const chunk = payload.slice(i, i + batchSize)
      const { error } = await supabase.from('students').insert(chunk)
      if (error) {
        failedErrors.push(error.message)
      } else {
        imported += chunk.length
      }
    }

    const duplicateCount = rows.filter((r) => r.isDuplicate).length
    const invalidCount = rows.filter((r) => !r.isValid).length
    setSummary({
      total: rows.length,
      imported,
      failed: invalidCount + duplicateCount + (newRows.length - imported),
      errors: failedErrors,
    })
    setStep('done')
    router.refresh()
  }

  // ── Counts ─────────────────────────────────────────────────────────────────

  const validCount = rows.filter((r) => r.isValid).length
  const invalidCount = rows.filter((r) => !r.isValid).length
  const duplicateCount = rows.filter((r) => r.isDuplicate).length
  const newCount = rows.filter((r) => r.isValid && !r.isDuplicate).length
  // duplicatesChecked is managed as state — see useState above

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
          <Upload className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Import Students</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Upload a CSV file to add multiple students at once.
          </p>
        </div>
      </div>

      {/* ── Step: UPLOAD ─────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Template download */}
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[oklch(0.62_0.22_265/0.1)] flex items-center justify-center flex-shrink-0">
                <FileText className="w-4.5 h-4.5 text-[var(--primary)] w-[18px] h-[18px]" />
              </div>
              <div>
                <p className="text-sm font-medium">Download Template</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Use our CSV template to format your student data correctly.
                </p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
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
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              or click to browse files
            </p>
            <span className="text-xs px-3 py-1 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
              .csv files only
            </span>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}

          {/* CSV format hint */}
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Expected CSV Format
            </p>
            <div className="rounded-lg bg-[oklch(0.08_0.01_240)] border border-[var(--border)] p-3 font-mono text-xs text-[var(--muted-foreground)] overflow-x-auto">
              <p className="text-[var(--primary)]">roll_no,name,parent_phone,batch</p>
              <p>101,Rohan Sharma,9876543210,JEE</p>
              <p>102,Priya Patel,9123456789,NEET</p>
              <p>103,Arjun Mehta,8765432109,CET A</p>
              <p>104,Sneha Rao,9988776655,CET B</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                roll_no — required
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                name — required
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] inline-block" />
                parent_phone — optional
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] inline-block" />
                batch — optional
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Step: PREVIEW ────────────────────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-5 text-center">
              <p className="text-3xl font-bold mb-1">{rows.length}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Total Rows</p>
            </div>
            <div className="glass-card rounded-2xl p-5 text-center border border-green-500/20">
              <p className="text-3xl font-bold text-green-400 mb-1">{newCount}</p>
              <p className="text-sm text-[var(--muted-foreground)]">New Students</p>
            </div>
            <div className={`glass-card rounded-2xl p-5 text-center ${duplicateCount > 0 ? 'border border-amber-500/20' : ''}`}>
              <p className={`text-3xl font-bold mb-1 ${duplicateCount > 0 ? 'text-amber-400' : 'text-[var(--muted-foreground)]'}`}>
                {duplicateCount}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">Already Exists</p>
            </div>
            <div className={`glass-card rounded-2xl p-5 text-center ${invalidCount > 0 ? 'border border-red-500/20' : ''}`}>
              <p className={`text-3xl font-bold mb-1 ${invalidCount > 0 ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>
                {invalidCount}
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">Invalid Rows</p>
            </div>
          </div>

          {/* File info + actions */}
          <div className="glass-card rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{rows.length} rows parsed</p>
              </div>
            </div>
            <button
              onClick={() => { setStep('upload'); setRows([]); setFileName(''); setParseError(null); setDuplicatesChecked(false) }}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-upload
            </button>
          </div>

          {/* Validation table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.5)] flex items-center justify-between">
              <p className="text-sm font-semibold">Preview</p>
              <p className="text-xs text-[var(--muted-foreground)]">Review before importing</p>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[40px_80px_1fr_100px_100px_1fr] gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.3)]">
              {['#', 'Status', 'Name', 'Roll No', 'Phone', 'Batch / Errors'].map((h) => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--border)] max-h-[420px] overflow-y-auto">
              {rows.map((row) => (
                <div
                  key={row.rowIndex}
                  className={`grid grid-cols-[40px_80px_1fr_100px_100px_1fr] gap-3 px-5 py-3 items-center text-sm ${
                    row.isDuplicate
                      ? 'bg-amber-500/5'
                      : row.isValid
                      ? ''
                      : 'bg-red-500/5'
                  }`}
                >
                  <span className="text-xs text-[var(--muted-foreground)]">{row.rowIndex}</span>
                  <span>
                    {row.isDuplicate ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : row.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </span>
                  <span className={`truncate font-medium ${!row.name ? 'text-red-400 italic' : row.isDuplicate ? 'text-amber-400/80' : ''}`}>
                    {row.name || '(empty)'}
                  </span>
                  <span className={`font-mono text-xs ${!row.roll_no ? 'text-red-400 italic' : row.isDuplicate ? 'text-amber-400/80' : 'text-[var(--primary)]'}`}>
                    {row.roll_no || '(empty)'}
                  </span>
                  <span className={`text-xs font-mono ${row.isDuplicate ? 'text-amber-400/80' : 'text-[var(--muted-foreground)]'}`}>
                    {row.parent_phone || '—'}
                  </span>
                  <span className="text-xs">
                    {row.isDuplicate ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Already exists — will be skipped
                      </span>
                    ) : row.isValid ? (
                      <span className="text-[var(--muted-foreground)]">{row.batch || '—'}</span>
                    ) : (
                      <span className="text-red-400">{row.errors.join(' · ')}</span>
                    )}
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
            <div className="flex items-center justify-between gap-4 flex-wrap gap-y-3">
              <div className="flex flex-col gap-1">
                {invalidCount > 0 && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
                    {invalidCount} invalid row{invalidCount > 1 ? 's' : ''} will be skipped.
                  </p>
                )}
                {duplicateCount > 0 && (
                  <p className="text-sm text-amber-400/90">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''} detected — will be skipped.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => { setStep('upload'); setRows([]); setFileName(''); setDuplicatesChecked(false) }}
                  className="px-4 py-2.5 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
                >
                  Cancel
                </button>
                {/* Step 1: Check duplicates first */}
                {!duplicatesChecked ? (
                  <button
                    id="check-duplicates-btn"
                    onClick={checkAndPreviewDuplicates}
                    disabled={!coachingCenterId || isCheckingDuplicates}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all glow-primary"
                  >
                    {isCheckingDuplicates ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                    ) : (
                      <><ChevronRight className="w-4 h-4" /> Check for Duplicates</>
                    )}
                  </button>
                ) : (
                  /* Step 2: Confirm import after seeing duplicates */
                  <button
                    id="confirm-import-btn"
                    onClick={handleImport}
                    disabled={!coachingCenterId || newCount === 0}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all glow-primary"
                  >
                    Import {newCount} New Student{newCount !== 1 ? 's' : ''}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step: IMPORTING ──────────────────────────────────────────────── */}
      {step === 'importing' && (
        <div className="glass-card rounded-2xl py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mb-5" />
          <h3 className="text-lg font-semibold mb-2">Importing students…</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Please wait while we save {validCount} student{validCount > 1 ? 's' : ''} to your institute.
          </p>
        </div>
      )}

      {/* ── Step: DONE ───────────────────────────────────────────────────── */}
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

          {/* Success message */}
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {summary.imported} student{summary.imported !== 1 ? 's' : ''} imported!
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-6">
              {summary.failed > 0
                ? `${summary.failed} row${summary.failed > 1 ? 's were' : ' was'} skipped due to validation errors.`
                : 'All valid students have been added to your institute.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setStep('upload'); setRows([]); setFileName(''); setSummary(null); setDuplicatesChecked(false) }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
              >
                <Upload className="w-4 h-4" />
                Import More
              </button>
              <Link
                href="/dashboard/students"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all glow-primary"
              >
                <Users className="w-4 h-4" />
                View Students
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
