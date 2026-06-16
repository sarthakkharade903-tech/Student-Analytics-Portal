'use client'

import { useState, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Papa from 'papaparse'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, X, FileText, Download } from 'lucide-react'

export default function CsvUploadPage({ params }: { params: Promise<{ classId: string }> }) {
  // params not strictly needed for CSV (it handles both standards), but kept for consistency
  use(params)
  const supabase = createClient()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFileChange = (f: File | null) => {
    if (f && f.name.endsWith('.csv')) {
      setFile(f)
      setResults(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    handleFileChange(dropped)
  }

  const handleFileUpload = async () => {
    if (!file) return
    setLoading(true)
    setResults(null)
    setProgress(0)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user.id).single()
    if (!profile?.coaching_center_id) return
    const centerId = profile.coaching_center_id

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rows = parsed.data as any[]
        let successCount = 0
        const errorList: string[] = []

        for (const [index, row] of rows.entries()) {
          const rowNum = index + 2
          const pct = Math.round(((index + 1) / rows.length) * 100)
          setProgress(pct)

          try {
            const name = row['Student Name']?.trim()
            const rollNo = row['Roll Number']?.trim()
            const amountStr = row['Fee Amount Paid']?.trim()
            const totalFeeStr = row['Total Fee']?.trim()

            if (!name && !rollNo) {
              errorList.push(`Row ${rowNum}: Missing Student Name or Roll Number`)
              continue
            }

            const amount = Math.round(parseFloat(amountStr))
            if (isNaN(amount) || amount <= 0) {
              errorList.push(`Row ${rowNum}: Invalid Fee Amount Paid for ${rollNo || name}`)
              continue
            }

            const totalFeeOverride = totalFeeStr ? Math.round(parseFloat(totalFeeStr)) : null

            // Find student
            let query = supabase.from('students').select('id, standard, batch').eq('coaching_center_id', centerId)
            if (rollNo) query = query.eq('roll_no', rollNo)
            else query = (query as any).ilike('name', name)

            const { data: students, error: studentError } = await query

            if (studentError || !students || students.length === 0) {
              errorList.push(`Row ${rowNum}: Student not found — ${rollNo || name}`)
              continue
            }

            const student = students[0]
            const receiptNumber = `CSV-${Date.now().toString().slice(-8)}-${index}`
            
            const newPayment = {
              amount,
              date: new Date().toISOString(),
              receipt_number: receiptNumber
            }

            // 1. Check existing fee record
            const { data: existingRecord } = await supabase
              .from('fees')
              .select('*')
              .eq('student_id', student.id)
              .maybeSingle()

            if (existingRecord) {
              // Update
              const updatedHistory = [...(existingRecord.payment_history || []), newPayment]
              const newTotalPaid = Math.round((Number(existingRecord.amount_paid || 0) + amount) * 100) / 100
              const newTotalFee = totalFeeOverride !== null && !isNaN(totalFeeOverride) ? totalFeeOverride : existingRecord.total_fee

              const { error: updateError } = await supabase
                .from('fees')
                .update({ 
                  amount_paid: newTotalPaid,
                  total_fee: newTotalFee,
                  payment_history: updatedHistory,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingRecord.id)
                
              if (updateError) throw updateError
            } else {
              // Insert
              const initialTotalFee = totalFeeOverride !== null && !isNaN(totalFeeOverride) ? totalFeeOverride : 0
              
              const { error: insertError } = await supabase
                .from('fees')
                .insert({
                  coaching_center_id: centerId,
                  student_id: student.id,
                  total_fee: initialTotalFee,
                  amount_paid: amount,
                  payment_history: [newPayment]
                })
                
              if (insertError) throw insertError
            }

            successCount++
          } catch (err: any) {
            errorList.push(`Row ${rowNum}: ${err.message}`)
          }
        }

        setResults({ success: successCount, errors: errorList })
        setLoading(false)
        setProgress(100)
      },
      error: (error) => {
        setResults({ success: 0, errors: [`CSV Parse Error: ${error.message}`] })
        setLoading(false)
      }
    })
  }

  const downloadTemplate = () => {
    const csv = 'Student Name,Roll Number,Parent Contact Number,Standard,Batch,Fee Amount Paid,Total Fee\nRahul Sharma,101,9876543210,11,11-A,15000,50000\nPriya Singh,102,9876543211,12,12-B,20000,60000'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'fee_upload_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Bulk CSV Upload</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Upload fee payments in bulk for Class 11 and 12 students.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 text-sm text-[var(--primary)] border border-[var(--primary)]/30 bg-[oklch(0.62_0.22_265/0.08)] hover:bg-[oklch(0.62_0.22_265/0.15)] px-3 py-2 rounded-lg transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Format Guide */}
      <div className="bg-[var(--sidebar-accent)] p-5 rounded-xl border border-[var(--border)] mb-6">
        <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
          <FileSpreadsheet className="w-4 h-4 text-[var(--primary)]" />
          Required CSV Column Headers
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Student Name', 'Roll Number', 'Parent Contact Number', 'Standard', 'Batch', 'Fee Amount Paid', 'Total Fee'].map(col => (
            <span key={col} className={`bg-[var(--background)] px-2.5 py-1 rounded-lg text-xs border ${col === 'Total Fee' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--foreground)]'} font-mono shadow-sm`}>
              {col}
              {col === 'Total Fee' && ' (Optional)'}
            </span>
          ))}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-3">Students are matched by Roll Number first, then Name. Amount must be a positive number. Optional Total Fee updates their full fee setting.</p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center mb-6 cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[var(--primary)] bg-[oklch(0.62_0.22_265/0.08)]'
            : file
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/60 hover:bg-[oklch(0.62_0.22_265/0.04)]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />

        {file ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border-2 border-emerald-500/30">
              <FileText className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="font-semibold text-[var(--foreground)]">{file.name}</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setResults(null) }}
              className="mt-4 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 border border-red-500/20 hover:bg-red-500/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" /> Remove File
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4 border-2 border-[var(--primary)]/20">
              <UploadCloud className="w-7 h-7 text-[var(--primary)]" />
            </div>
            <p className="font-semibold text-[var(--foreground)]">
              {isDragging ? 'Drop your CSV here' : 'Drag & drop or click to browse'}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Only .csv files accepted</p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {loading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
            <span>Processing rows...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--sidebar-accent)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!results ? (
        <button
          onClick={handleFileUpload}
          disabled={!file || loading}
          className="w-full bg-[var(--primary)] text-primary-foreground font-semibold rounded-xl py-3.5 px-4 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
        >
          <UploadCloud className="w-4 h-4" />
          {loading ? `Processing... (${progress}%)` : 'Upload & Process Payments'}
        </button>
      ) : (
        <button
          onClick={() => { setFile(null); setResults(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
          className="w-full bg-[var(--sidebar-accent)] text-[var(--foreground)] border border-[var(--border)] font-semibold rounded-xl py-3.5 px-4 hover:bg-[oklch(0.62_0.22_265/0.05)] transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Another CSV
        </button>
      )}

      {/* Results */}
      {results && (
        <div className="mt-8 space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-600">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">{results.success} payments processed successfully.</p>
              {results.errors.length > 0 && (
                <p className="text-sm font-normal mt-0.5 text-green-700">{results.errors.length} rows had errors (see below).</p>
              )}
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-600 font-semibold mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span>Errors ({results.errors.length})</span>
              </div>
              <ul className="text-sm text-[var(--muted-foreground)] space-y-1.5 max-h-52 overflow-y-auto">
                {results.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
