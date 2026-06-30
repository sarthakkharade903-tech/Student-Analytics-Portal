'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Upload, AlertTriangle, Loader2, CheckCircle2, FileSpreadsheet, LayoutGrid, Clock, BarChart, History, ChevronDown, ChevronRight, MessageCircle, Save, RotateCcw, Copy, Check } from 'lucide-react'
import StandardTabs from '@/components/dashboard/StandardTabs'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Student {
  id: string
  name: string
  roll_no: string
  batch: string
}

interface AttendanceRecord {
  id?: string
  student_id: string
  coaching_center_id?: string
  date: string
  is_present: boolean
}

export default function AttendanceClient({
  coachingCenterId,
  standard,
  coachingName = 'Your Institute',
  initialAbsenceTemplate = null,
}: {
  coachingCenterId: string
  standard: string
  coachingName?: string
  initialAbsenceTemplate?: string | null
}) {
  const supabase = useMemo(() => createClient(), [])
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const PORTAL_URL = 'https://studentiq.vercel.app/parent/login'

  const buildDefaultAbsenceTemplate = () =>
    `*Daily Attendance / दैनिक उपस्थिती ⭐*\nDate: {{DATE}} | Batch: {{BATCH}}\n\nAbsent Students / अनुपस्थित विद्यार्थी:\n\n{{ABSENT_LIST}}\n\nView more details on the Parent Portal.\nअधिक माहितीसाठी पालक पोर्टलला भेट द्या.\n${PORTAL_URL}\n\n– {{ACADEMY_NAME}}`

  // State
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'analytics'>('daily')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedBatch, setSelectedBatch] = useState<string>('All')
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)
  
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, boolean>>({}) // map of student_id -> is_present
  const [historyAttendance, setHistoryAttendance] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Quick entry state
  const [quickAbsents, setQuickAbsents] = useState('')
  const [csvContent, setCsvContent] = useState('')

  // WhatsApp absence template state
  const [absenceTemplate, setAbsenceTemplate] = useState(
    initialAbsenceTemplate || buildDefaultAbsenceTemplate()
  )
  const [absenceIsCopied, setAbsenceIsCopied] = useState(false)
  const [absenceIsSaving, setAbsenceIsSaving] = useState(false)

  // Derived state
  const batches = useMemo(() => {
    const b = new Set<string>()
    students.forEach(s => { if (s.batch) b.add(s.batch) })
    return ['All', ...Array.from(b).sort()]
  }, [students])

  const currentBatchStudents = useMemo(() => {
    const sortFn = (a: { roll_no: string }, b: { roll_no: string }) => {
      const aMatch = a.roll_no?.match(/^(\D*)(\d+)(.*)$/)
      const bMatch = b.roll_no?.match(/^(\D*)(\d+)(.*)$/)
      if (aMatch && bMatch) {
        if (aMatch[1] === bMatch[1]) {
          return parseInt(aMatch[2]) - parseInt(bMatch[2])
        }
      }
      return (a.roll_no || '').localeCompare(b.roll_no || '')
    }

    if (selectedBatch === 'All') return [...students].sort(sortFn)
    return students.filter(s => s.batch === selectedBatch).sort(sortFn)
  }, [students, selectedBatch])

  // Fetch all students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, roll_no, batch')
        .eq('coaching_center_id', coachingCenterId)
        .eq('standard', standard)
      
      if (error) setError(error.message)
      else if (data) {
        setStudents(data)
        // Auto-select first batch if none selected
        const batchSet = new Set<string>()
        data.forEach((s: { batch: string }) => { if (s.batch) batchSet.add(s.batch) })
        const uniqueBatches = ['All', ...Array.from(batchSet).sort()]
        if (uniqueBatches.length > 0) setSelectedBatch(uniqueBatches[0])
      }
      setLoading(false)
    }
    fetchStudents()
  }, [coachingCenterId, standard])

  // Fetch attendance when date or batch changes
  useEffect(() => {
    if (!selectedBatch || !selectedDate) return

    const fetchDailyAttendance = async () => {
      const batchStudentIds = currentBatchStudents.map(s => s.id)
      if (batchStudentIds.length === 0) {
        setAttendance({})
        return
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, is_present')
        .eq('date', selectedDate)
        .in('student_id', batchStudentIds)

      if (error) {
        console.error(error)
      } else if (data) {
        const attMap: Record<string, boolean> = {}
        data.forEach((r: { student_id: string; is_present: boolean }) => { attMap[r.student_id] = r.is_present })
        setAttendance(attMap)
      }
      setLoading(false)
    }

    if (activeTab === 'daily') {
      fetchDailyAttendance()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedBatch, students, activeTab])

  // Fetch history when history tab is active
  useEffect(() => {
    if (activeTab !== 'history' && activeTab !== 'analytics') return
    if (!selectedBatch) return

    const fetchHistory = async () => {
      const batchStudentIds = currentBatchStudents.map(s => s.id)
      if (batchStudentIds.length === 0) return

      setLoading(true)
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, date, is_present')
        .in('student_id', batchStudentIds)
      
      if (data) {
        setHistoryAttendance(data)
      }
      setLoading(false)
    }
    fetchHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, students, activeTab])

  // ===========================================================================
  // WhatsApp Absence Helpers
  // ===========================================================================

  const absentStudents = useMemo(() => {
    return currentBatchStudents.filter(s => attendance[s.id] === false)
  }, [currentBatchStudents, attendance])

  const compileAbsenceMessage = (tmpl: string) => {
    const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
    const batchLabel = selectedBatch === 'All' ? 'All Batches' : selectedBatch
    const absentList = absentStudents.length === 0
      ? '(Nobody is absent today!)'
      : absentStudents.map((s, i) => `${i + 1}. ${s.name} (Roll: ${s.roll_no})`).join('\n')
    return tmpl
      .replace(/{{DATE}}/g, formattedDate)
      .replace(/{{BATCH}}/g, batchLabel)
      .replace(/{{ABSENT_LIST}}/g, absentList)
      .replace(/{{ACADEMY_NAME}}/g, coachingName)
  }

  const handleSaveAbsenceTemplate = async () => {
    setAbsenceIsSaving(true)
    try {
      const res = await fetch('/api/coaching/absence-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: absenceTemplate }),
      })
      if (!res.ok) throw new Error('Failed')
      displaySuccess('Absence template saved!')
    } catch {
      setError('Failed to save template.')
    } finally {
      setAbsenceIsSaving(false)
    }
  }

  const handleResetAbsenceTemplate = () => {
    if (confirm('Reset to the default bilingual template?')) {
      setAbsenceTemplate(buildDefaultAbsenceTemplate())
    }
  }

  const handleCopyAbsenceMessage = async () => {
    try {
      await navigator.clipboard.writeText(compileAbsenceMessage(absenceTemplate))
      setAbsenceIsCopied(true)
      setTimeout(() => setAbsenceIsCopied(false), 2000)
    } catch {}
  }

  const handleSendAbsenceWhatsApp = () => {
    const msg = compileAbsenceMessage(absenceTemplate)
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const displaySuccess = (msg: string) => {
    setSuccess(msg)
    setError(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  const saveAttendanceRecords = async (records: AttendanceRecord[]) => {
    setSaving(true)
    setError(null)
    
    // Add coaching_center_id to all
    const toUpsert = records.map(r => ({
      ...r,
      coaching_center_id: coachingCenterId
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(toUpsert, { onConflict: 'student_id,date' })

    if (error) {
      setError(`Failed to save: ${error.message}`)
    } else {
      displaySuccess('Attendance saved successfully!')
      
      // Update local state map
      const newMap = { ...attendance }
      records.forEach(r => {
        if (r.date === selectedDate) {
          newMap[r.student_id] = r.is_present
        }
      })
      setAttendance(newMap)
    }
    setSaving(false)
  }

  const handleManualToggle = (studentId: string, isPresent: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: isPresent }))
  }

  const handleSaveManual = () => {
    const records: AttendanceRecord[] = currentBatchStudents.map(s => ({
      student_id: s.id,
      date: selectedDate,
      // Default to present if not marked explicitly (or we can demand they mark all)
      // Let's assume if it's undefined, we don't save it, or default to true?
      // Better: Explicitly require checking, but for ease, if it's in the map, use it, else true
      is_present: attendance[s.id] ?? true
    }))
    saveAttendanceRecords(records)
  }

  const handleMarkAll = (isPresent: boolean) => {
    const newMap = { ...attendance }
    currentBatchStudents.forEach(s => {
      newMap[s.id] = isPresent
    })
    setAttendance(newMap)
  }

  const handleQuickAbsentSubmit = () => {
    if (!quickAbsents.trim()) {
      handleMarkAll(true)
      handleSaveManual()
      return
    }

    const absentRolls = quickAbsents.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    
    const records: AttendanceRecord[] = currentBatchStudents.map(s => {
      const isAbsent = absentRolls.includes(s.roll_no.toLowerCase())
      return {
        student_id: s.id,
        date: selectedDate,
        is_present: !isAbsent
      }
    })
    
    saveAttendanceRecords(records)
    setQuickAbsents('') // clear after success
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvContent(text)
    }
    reader.readAsText(file)
  }

  const processCsv = () => {
    if (!csvContent) return
    
    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean)
    // Ignore header if it exists
    if (lines[0].toLowerCase().includes('roll_no')) {
      lines.shift()
    }

    const rollNoMap = new Map<string, boolean>()
    lines.forEach(line => {
      const [roll, presentStr] = line.split(',')
      if (roll && presentStr) {
        rollNoMap.set(roll.trim().toLowerCase(), presentStr.trim().toLowerCase() === 'true')
      }
    })

    const records: AttendanceRecord[] = []
    let notFoundCount = 0

    currentBatchStudents.forEach(s => {
      const rollKey = s.roll_no.toLowerCase()
      if (rollNoMap.has(rollKey)) {
        records.push({
          student_id: s.id,
          date: selectedDate,
          is_present: rollNoMap.get(rollKey)!
        })
      } else {
        notFoundCount++
      }
    })

    if (records.length === 0) {
      setError("No matching roll numbers found in the CSV for the selected batch.")
      return
    }

    saveAttendanceRecords(records)
    setCsvContent('')
    if (notFoundCount > 0) {
      setTimeout(() => alert(`${notFoundCount} students in this batch were not found in the CSV.`), 500)
    }
  }

  // ===========================================================================
  // Analytics Computations
  // ===========================================================================
  
  const historyStats = useMemo(() => {
    if (!historyAttendance.length) return []
    
    const statsMap: Record<string, { present: number, total: number }> = {}
    
    // Initialize stats
    currentBatchStudents.forEach(s => {
      statsMap[s.id] = { present: 0, total: 0 }
    })

    // Accumulate
    historyAttendance.forEach((record: { student_id: string; is_present: boolean }) => {
      if (statsMap[record.student_id]) {
        statsMap[record.student_id].total++
        if (record.is_present) statsMap[record.student_id].present++
      }
    })

    return currentBatchStudents.map(s => {
      const st = statsMap[s.id]
      const pct = st.total === 0 ? 0 : (st.present / st.total) * 100
      return {
        ...s,
        presentDays: st.present,
        totalDays: st.total,
        absentDays: st.total - st.present,
        percentage: pct
      }
    }).sort((a, b) => b.percentage - a.percentage) // sort highest first
  }, [historyAttendance, currentBatchStudents])
  const groupedHistory = useMemo(() => {
    if (!historyAttendance.length) return {}
    
    const studentMap = new Map<string, Student>()
    students.forEach(s => studentMap.set(s.id, s))

    const grouped: Record<string, Record<string, any[]>> = {}
    
    historyAttendance.forEach((record: any) => {
      const student = studentMap.get(record.student_id)
      if (!student) return
      
      const date = record.date
      const batch = student.batch || 'Unassigned'
      
      if (!grouped[date]) grouped[date] = {}
      if (!grouped[date][batch]) grouped[date][batch] = []
      
      grouped[date][batch].push({
        ...record,
        student
      })
    })

    // Filter to only include past dates and today
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    const sortedDates = Object.keys(grouped)
      .filter(date => new Date(date) <= today)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    const sortedGrouped: Record<string, Record<string, any[]>> = {}
    
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date]
    })

    return sortedGrouped
  }, [historyAttendance, students])

  // Analytics for the line graph
  const lineChartData = useMemo(() => {
    if (!historyAttendance.length) return []
    const groupedByDate: Record<string, { present: number; total: number }> = {}
    
    historyAttendance.forEach((r: any) => {
      if (!groupedByDate[r.date]) groupedByDate[r.date] = { present: 0, total: 0 }
      groupedByDate[r.date].total++
      if (r.is_present) groupedByDate[r.date].present++
    })

    return Object.entries(groupedByDate)
      .map(([date, stats]) => ({
        date,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [historyAttendance])

  // Global analytics for the selected batch
  const batchAnalytics = useMemo(() => {
    if (!historyStats.length) return null

    let totalP = 0
    let totalD = 0
    let highest = historyStats[0]
    let lowest = historyStats[historyStats.length - 1]

    historyStats.forEach(s => {
      totalP += s.presentDays
      totalD += s.totalDays
    })

    // Today's attendance
    const todayRecords = historyAttendance.filter((r: { date: string; is_present: boolean }) => r.date === selectedDate)
    const todayPresent = todayRecords.filter(r => r.is_present).length
    const todayPct = todayRecords.length > 0 ? (todayPresent / todayRecords.length) * 100 : 0

    return {
      averagePct: totalD > 0 ? (totalP / totalD) * 100 : 0,
      highest,
      lowest,
      todayPct,
      todayPresent,
      todayAbsent: todayRecords.length - todayPresent
    }
  }, [historyStats, historyAttendance, selectedDate])

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[oklch(0.10_0.01_240/0.3)] border border-[var(--border)] p-4 rounded-2xl glass-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Attendance — {standard}</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Manage daily {standard} student attendance</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            className="flex-1 md:w-40 px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
          >
            {batches.map(b => (
              <option key={b} value={b} className="bg-white text-gray-900">{b === 'All' ? 'All Batches' : `Batch: ${b}`}</option>
            ))}
          </select>
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={e => setSelectedDate(e.target.value)}
            onClick={e => (e.target as any).showPicker?.()}
            className="flex-1 md:w-40 px-3 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
          />
        </div>
      </div>

      <StandardTabs />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-[oklch(0.97_0.01_240)] p-1 rounded-xl w-fit border border-[var(--border)]">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'daily' ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--muted-foreground)] hover:text-gray-900 hover:bg-black/5'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Daily Entry
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history' ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--muted-foreground)] hover:text-gray-900 hover:bg-black/5'
          }`}
        >
          <History className="w-4 h-4" /> History
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'analytics' ? 'bg-[var(--primary)] text-white shadow-lg' : 'text-[var(--muted-foreground)] hover:text-gray-900 hover:bg-black/5'
          }`}
        >
          <BarChart className="w-4 h-4" /> Analytics
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex items-center gap-3 text-green-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {loading && !students.length ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>
      ) : (
        <>
          {activeTab === 'daily' && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Quick Entry & CSV */}
              <div className="xl:col-span-1 space-y-6">
                
                {/* Method 2: Quick Absent Entry */}
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <h2 className="font-bold">Quick Absent Entry</h2>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4">
                    Fastest method. Type comma-separated roll numbers of absent students. Everyone else will be marked present automatically.
                  </p>
                  <textarea
                    value={quickAbsents}
                    onChange={e => setQuickAbsents(e.target.value)}
                    placeholder="e.g. 102, 105, 112"
                    className="w-full h-24 bg-white/50 border border-[var(--border)] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono resize-none mb-3 text-gray-900"
                  />
                  <button
                    onClick={handleQuickAbsentSubmit}
                    disabled={saving}
                    className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-xl text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Submit & Save
                  </button>
                </div>

                {/* Method 1: CSV Upload */}
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                    <h2 className="font-bold">CSV Upload</h2>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mb-4">
                    Format: <code>roll_no, is_present</code> (e.g. <code>101, true</code>).
                  </p>
                  
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[var(--border)] rounded-xl hover:bg-black/5 transition-all cursor-pointer mb-3">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 text-[var(--muted-foreground)] mb-2" />
                      <p className="text-xs text-[var(--muted-foreground)]">Click to upload CSV</p>
                    </div>
                    <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                  </label>

                  {csvContent && (
                    <button
                      onClick={processCsv}
                      disabled={saving}
                      className="w-full py-2.5 bg-[var(--primary)] text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Process CSV
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Manual Sheet */}
              <div className="xl:col-span-2 glass-card rounded-2xl border border-[var(--border)] overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
                <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-black/5">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <h2 className="font-semibold text-sm">Manual Sheet ({currentBatchStudents.length} Students)</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleMarkAll(true)} className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-all">
                      All Present
                    </button>
                    <button onClick={() => handleMarkAll(false)} className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                      All Absent
                    </button>
                    <button 
                      onClick={handleSaveManual} 
                      disabled={saving}
                      className="ml-2 px-4 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-all"
                    >
                      {saving ? 'Saving...' : 'Save Sheet'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {currentBatchStudents.length === 0 ? (
                    <div className="p-8 text-center text-[var(--muted-foreground)] text-sm">No students in this batch.</div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {currentBatchStudents.map(student => {
                        // Default visual is 'present' if undefined, because teachers usually assume present
                        const isPresent = attendance[student.id] ?? true

                        return (
                          <div key={student.id} className="flex items-center justify-between px-5 py-3 hover:bg-black/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                              <span className="w-12 text-xs font-mono text-[var(--muted-foreground)]">{student.roll_no}</span>
                              <span className="text-sm font-medium">{student.name}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-[var(--border)]">
                              <button
                                onClick={() => handleManualToggle(student.id, true)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                  isPresent ? 'bg-green-500 text-white shadow-sm' : 'text-[var(--muted-foreground)] hover:text-gray-900'
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleManualToggle(student.id, false)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                  !isPresent ? 'bg-red-500 text-white shadow-sm' : 'text-[var(--muted-foreground)] hover:text-gray-900'
                                }`}
                              >
                                A
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-6 bg-[#0f1729] rounded-xl border border-slate-800 p-6 shadow-lg">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <h3 className="font-semibold text-white">Share Absence Report</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetAbsenceTemplate}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 text-sm"
                        title="Reset to Default"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Reset Default</span>
                      </button>
                      <button
                        onClick={handleCopyAbsenceMessage}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 text-sm"
                      >
                        {absenceIsCopied ? (
                          <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied</span></>
                        ) : (
                          <><Copy className="w-4 h-4" /><span>Copy text</span></>
                        )}
                      </button>
                    </div>
                  </div>

                  {absentStudents.length === 0 ? (
                    <div className="w-full min-h-[120px] bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                      <p className="text-green-400 font-semibold text-sm">All students are present today! 🎉</p>
                      <p className="text-slate-500 text-xs">No WhatsApp message needed.</p>
                    </div>
                  ) : (
                    <textarea
                      value={absenceTemplate}
                      onChange={e => setAbsenceTemplate(e.target.value)}
                      className="w-full min-h-[220px] bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 resize-y focus:outline-none focus:border-green-500/50 transition-colors"
                      spellCheck={false}
                    />
                  )}
                </div>

                <div className="w-full md:w-56 flex flex-col justify-end gap-3">
                  <button
                    onClick={handleSaveAbsenceTemplate}
                    disabled={absenceIsSaving}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-lg text-sm font-bold transition-colors border border-slate-600 disabled:opacity-50"
                  >
                    {absenceIsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Template
                  </button>
                  <button
                    onClick={handleSendAbsenceWhatsApp}
                    disabled={absentStudents.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#25D366]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send via WhatsApp
                  </button>
                  <p className="text-xs text-slate-500 text-center">
                    {absentStudents.length === 0 ? 'No absentees to report' : 'Opens WhatsApp Web or App'}
                  </p>
                </div>
              </div>
            </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {Object.keys(groupedHistory).length === 0 ? (
                <div className="glass-card rounded-2xl p-8 text-center text-[var(--muted-foreground)]">
                  No attendance history found.
                </div>
              ) : (
                Object.keys(groupedHistory).map(date => {
                  // Compute summary for this date across all batches
                  const allRecordsForDate = Object.values(groupedHistory[date]).flat() as { is_present: boolean }[]
                  const totalCount = allRecordsForDate.length
                  const presentCount = allRecordsForDate.filter(r => r.is_present).length
                  const absentCount = totalCount - presentCount
                  const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
                  const chipColor = pct >= 75 ? 'bg-green-500/10 text-green-400 border-green-500/20' : pct >= 50 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'

                  return (
                  <div key={date} className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden">
                    <div
                      onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                      className="w-full px-5 py-4 flex items-center justify-between bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="font-semibold text-sm">{new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                        {/* Attendance summary chip */}
                        {totalCount > 0 && (
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${chipColor}`}>
                            {presentCount}/{totalCount} · {pct}%
                            {absentCount > 0 && <span className="text-red-400 font-bold">({absentCount} absent)</span>}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveTab('daily'); setSelectedDate(date); }}
                          className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                      {expandedDate === date ? <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-5 h-5 text-[var(--muted-foreground)]" />}
                    </div>
                    
                    {expandedDate === date && (
                      <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                        {Object.keys(groupedHistory[date]).sort().map(batch => (
                          <div key={batch} className="bg-black/5">
                            <button
                              onClick={() => setExpandedBatch(expandedBatch === batch ? null : batch)}
                              className="w-full px-6 py-3 flex items-center justify-between hover:bg-black/[0.02] transition-colors"
                            >
                              <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Batch: {batch}</h3>
                              {expandedBatch === batch ? <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />}
                            </button>
                            
                            {expandedBatch === batch && (
                              <div className="bg-black/[0.02] p-4 border-t border-[var(--border)]">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {groupedHistory[date][batch].sort((a, b) => a.student.roll_no.localeCompare(b.student.roll_no)).map(record => (
                                    <div key={record.student.id} className="flex items-center justify-between bg-white/50 border border-[var(--border)] p-3 rounded-xl">
                                      <div>
                                        <div className="text-xs font-mono text-[var(--muted-foreground)]">{record.student.roll_no}</div>
                                        <div className="text-sm font-medium">{record.student.name}</div>
                                      </div>
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        record.is_present ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                      }`}>
                                        {record.is_present ? 'Present' : 'Absent'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'analytics' && batchAnalytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)]">
                  <p className="text-xs text-[var(--muted-foreground)] uppercase font-semibold tracking-wider mb-1">Today's Attendance</p>
                  <p className="text-3xl font-bold">{batchAnalytics.todayPct.toFixed(1)}%</p>
                  <div className="mt-2 text-sm flex gap-3">
                    <span className="text-green-400">{batchAnalytics.todayPresent} Present</span>
                    <span className="text-red-400">{batchAnalytics.todayAbsent} Absent</span>
                  </div>
                </div>
                
                <div className="glass-card rounded-2xl p-5 border border-[var(--border)]">
                  <p className="text-xs text-[var(--muted-foreground)] uppercase font-semibold tracking-wider mb-1">Batch Average</p>
                  <p className="text-3xl font-bold">{batchAnalytics.averagePct.toFixed(1)}%</p>
                </div>
              </div>

              {/* Day-wise Percentage Line Graph */}
              <div className="glass-card rounded-2xl p-6 border border-[var(--border)]">
                <h3 className="font-bold text-lg mb-6">Attendance Trend (Day-wise)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(255,255,255,0.5)" 
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.5)" 
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                        domain={[0, 100]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#000' }}
                        labelFormatter={(val) => new Date(val as string).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 and Bottom 10 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top 10 */}
                <div className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--border)] bg-black/5">
                    <h3 className="font-bold text-green-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Top 10 Highest Attendance</h3>
                  </div>
                  <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                    {historyStats.slice(0, 10).map((stat, idx) => (
                      <div key={stat.id} className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[var(--muted-foreground)] w-4">{idx + 1}.</span>
                          <div>
                            <p className="text-sm font-medium">{stat.name}</p>
                            <p className="text-xs font-mono text-[var(--muted-foreground)]">{stat.roll_no}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-600">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                    {historyStats.length === 0 && <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">No data</div>}
                  </div>
                </div>

                {/* Bottom 10 */}
                <div className="glass-card rounded-2xl border border-[var(--border)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--border)] bg-black/5">
                    <h3 className="font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Needs Attention (Bottom 10)</h3>
                  </div>
                  <div className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
                    {[...historyStats].reverse().slice(0, 10).map((stat, idx) => (
                      <div key={stat.id} className="flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[var(--muted-foreground)] w-4">{idx + 1}.</span>
                          <div>
                            <p className="text-sm font-medium">{stat.name}</p>
                            <p className="text-xs font-mono text-[var(--muted-foreground)]">{stat.roll_no}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-red-600">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                    {historyStats.length === 0 && <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">No data</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  )
}
