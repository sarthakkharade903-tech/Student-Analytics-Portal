'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Users, IndianRupee, TrendingUp, AlertCircle,
  X, History, Calendar, CheckCircle, Clock, Edit2, Save,
  Loader2, Settings, ChevronDown, ChevronUp, Plus, Trash2, Download
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type StudentFee = {
  student_id: string
  fee_id: string
  name: string
  roll_no: string
  batch: string
  parent_phone: string
  standard: number
  total_fee: number
  amount_paid: number
  remaining: number
  installments: PaymentRecord[]
  payment_history: PaymentRecord[]
  last_payment_date: string | null
  has_payment: boolean
}

type StudentRow = {
  id: string
  name: string
  roll_no: string
  batch: string
  parent_phone: string
}

type PaymentRecord = {
  date: string
  amount: number
  receipt_number?: string
  [key: string]: unknown
}

type FeeRow = {
  id: string
  student_id: string
  total_fee: number
  amount_paid: number
  payment_history: PaymentRecord[]
  installments: PaymentRecord[]
  [key: string]: unknown
}

export default function StudentFeeRecordsPage({ params }: { params: Promise<{ classId: string }> }) {
  const unwrappedParams = use(params)
  const classId = parseInt(unwrappedParams.classId)
  const supabase = createClient()

  const [records, setRecords] = useState<StudentFee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterBatch, setFilterBatch] = useState('All')
  const [batches, setBatches] = useState<string[]>([])
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, totalCollected: 0, totalDiscount: 0 })
  const [coachingName, setCoachingName] = useState('')

  // Class-level fee settings
  const [showFeeSettings, setShowFeeSettings] = useState(false)
  const [baseClassFee, setBaseClassFee] = useState(0)
  const [classTotalFee, setClassTotalFee] = useState('')
  const [classInstallments, setClassInstallments] = useState<any[]>([])
  const [savingClassFee, setSavingClassFee] = useState(false)
  const [classFeeMsg, setClassFeeMsg] = useState('')
  const [newInstName, setNewInstName] = useState('')
  const [newInstAmount, setNewInstAmount] = useState('')
  const [newInstDate, setNewInstDate] = useState('')

  // Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null)
  const [editingTotalFee, setEditingTotalFee] = useState(false)
  const [newStudentTotalFee, setNewStudentTotalFee] = useState('')
  const [newStudentDiscount, setNewStudentDiscount] = useState('')
  const [savingStudentFee, setSavingStudentFee] = useState(false)

  const fetchRecords = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('coaching_center_id, coaching_centers(name)')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.coaching_center_id) {
      setError('Could not load profile. Please refresh.')
      setLoading(false)
      return
    }
    const centerId = profile.coaching_center_id
    const cName = Array.isArray(profile.coaching_centers) ? profile.coaching_centers[0]?.name : (profile.coaching_centers as any)?.name
    setCoachingName(cName || 'Coaching Center')

    // Fetch students based on batch name pattern:
    // Class 12 = batches containing '12'
    // Class 11 = batches NOT containing '12'
    let studQuery = supabase
      .from('students')
      .select('id, name, roll_no, batch, parent_phone')
      .eq('coaching_center_id', centerId)
      .order('name', { ascending: true })

    if (classId === 12) {
      studQuery = studQuery.ilike('batch', '%12%')
    } else {
      studQuery = studQuery.not('batch', 'ilike', '%12%')
    }

    const { data: students, error: studErr } = await studQuery

    if (studErr) {
      setError(`Students query error: ${studErr.message}`)
      setLoading(false)
      return
    }

    if (!students || students.length === 0) {
      setRecords([])
      setStats({ total: 0, paid: 0, pending: 0, totalCollected: 0, totalDiscount: 0 })
      setBatches([])
      setLoading(false)
      return
    }

    const studentIds = (students as StudentRow[]).map((s) => s.id)
    const uniqueBatches = [...new Set((students as StudentRow[]).map((s) => s.batch).filter(Boolean) as string[])]
    setBatches(uniqueBatches)

    // 2. Fetch fee records
    const { data: feeRecords } = await supabase
      .from('fees')
      .select('*')
      .in('student_id', studentIds)

    // 3. Fetch class-level fee settings for fallback
    const { data: classFeeSettings } = await supabase
      .from('class_fee_settings')
      .select('*')
      .eq('coaching_center_id', centerId)
      .eq('standard', classId)
      .maybeSingle()

    if (classFeeSettings) {
      setBaseClassFee(classFeeSettings.total_fee || 0)
      setClassTotalFee(classFeeSettings.total_fee?.toString() || '')
      setClassInstallments(classFeeSettings.installments || [])
    }

    // 4. Map data
    const typedStudents = students as StudentRow[]
    const typedFeeRecords = (feeRecords || []) as FeeRow[]
    const mapped: StudentFee[] = typedStudents.map((student) => {
      const feeRow = typedFeeRecords.find((f) => f.student_id === student.id)
      const classFallbackFee = classFeeSettings?.total_fee || 0
      const classFallbackInst = (classFeeSettings?.installments || []) as PaymentRecord[]

      const total = (feeRow?.total_fee && feeRow.total_fee > 0) ? feeRow.total_fee : classFallbackFee
      const paid = feeRow?.amount_paid ?? 0
      const history = (feeRow?.payment_history || []) as PaymentRecord[]
      const insts = (feeRow?.installments?.length ?? 0) > 0 ? feeRow!.installments : classFallbackInst
      const hasPayment = paid > 0

      let lastDate: string | null = null
      if (history.length > 0) {
        const sorted = [...history].sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
          if (dateDiff !== 0) return dateDiff
          // Same day: use receipt_number as tiebreaker — it contains Date.now() so it's chronological
          return (b.receipt_number || '').localeCompare(a.receipt_number || '')
        })
        lastDate = sorted[0].date
      }

      return {
        student_id: student.id,
        fee_id: feeRow?.id || '',
        name: student.name,
        roll_no: student.roll_no,
        batch: student.batch || '',
        parent_phone: student.parent_phone || '',
        standard: classId,
        total_fee: total,
        amount_paid: paid,
        remaining: total - paid,
        installments: insts,
        payment_history: history,
        last_payment_date: lastDate,
        has_payment: hasPayment
      }
    })

    setRecords(mapped)

    // Compute stats
    const totalCollected = Math.round(mapped.reduce((sum, r) => sum + r.amount_paid, 0) * 100) / 100
    const paidCount = mapped.filter(r => r.has_payment).length
    const classFallbackFee = classFeeSettings?.total_fee || 0
    const totalDiscount = Math.round(mapped.reduce((sum, r) => {
      const discount = classFallbackFee > r.total_fee && r.total_fee > 0 ? classFallbackFee - r.total_fee : 0
      return sum + discount
    }, 0) * 100) / 100

    setStats({ total: mapped.length, paid: paidCount, pending: mapped.length - paidCount, totalCollected, totalDiscount })

    setLoading(false)
  }

  useEffect(() => { fetchRecords() }, [classId])

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = r.name.toLowerCase().includes(q) || r.roll_no.toLowerCase().includes(q) || r.batch?.toLowerCase().includes(q)
    const matchBatch = filterBatch === 'All' || r.batch === filterBatch
    return matchSearch && matchBatch
  }).sort((a, b) => {
    // Sort by roll number numerically (treats "10" > "9", not "10" < "9")
    const aNum = parseInt(a.roll_no) || 0
    const bNum = parseInt(b.roll_no) || 0
    if (aNum !== bNum) return aNum - bNum
    // Fallback: alphabetical by roll_no string if not purely numeric
    return a.roll_no.localeCompare(b.roll_no)
  })

  // Save class-level fee setting
  const handleSaveClassFee = async () => {
    setSavingClassFee(true)
    setClassFeeMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user!.id).single()
    const centerId = profile!.coaching_center_id

    const totalFeeNum = parseFloat(classTotalFee) || 0

    const { error } = await supabase.from('class_fee_settings').upsert({
      coaching_center_id: centerId,
      standard: classId,
      total_fee: totalFeeNum,
      installments: classInstallments,
      updated_at: new Date().toISOString()
    }, { onConflict: 'coaching_center_id,standard' })

    if (error) { setClassFeeMsg(`Error: ${error.message}`) }
    else { setClassFeeMsg('✓ Class fee settings saved!'); fetchRecords() }
    setSavingClassFee(false)
  }

  const addInstallment = () => {
    if (!newInstName || !newInstAmount) return
    setClassInstallments(prev => [...prev, { name: newInstName, amount: parseFloat(newInstAmount), due_date: newInstDate }])
    setNewInstName(''); setNewInstAmount(''); setNewInstDate('')
  }

  const removeInstallment = (i: number) => setClassInstallments(prev => prev.filter((_, idx) => idx !== i))

  // Update per-student total fee
  const handleUpdateStudentFee = async () => {
    if (!selectedStudent) return
    const feeVal = parseFloat(newStudentTotalFee)
    if (isNaN(feeVal)) return
    setSavingStudentFee(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user!.id).single()
    const centerId = profile!.coaching_center_id

    if (selectedStudent.fee_id) {
      await supabase.from('fees').update({ total_fee: feeVal }).eq('id', selectedStudent.fee_id)
    } else {
      await supabase.from('fees').insert({
        coaching_center_id: centerId,
        student_id: selectedStudent.student_id,
        total_fee: feeVal,
        amount_paid: 0,
        payment_history: []
      })
    }

    await fetchRecords()
    setSelectedStudent(prev => prev ? { ...prev, total_fee: feeVal, remaining: feeVal - prev.amount_paid } : null)
    setEditingTotalFee(false)
    setSavingStudentFee(false)
  }

  const downloadAuditReport = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`Fee Audit Report - Class ${classId}`, 14, 22)
    
    doc.setFontSize(11)
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 32)
    doc.text(`Filter: ${filterBatch === 'All' ? 'All Batches' : filterBatch}`, 14, 38)
    
    // Summary
    doc.text(`Total Students: ${stats.total}`, 14, 48)
    doc.text(`Students with Payment: ${stats.paid}`, 70, 48)
    doc.text(`Students Pending: ${stats.pending}`, 140, 48)
    doc.text(`Total Collected: Rs. ${stats.totalCollected.toLocaleString()}`, 14, 54)
    doc.text(`Total Discount: Rs. ${stats.totalDiscount.toLocaleString()}`, 70, 54)
    
    const tableData = filtered.map(r => [
      r.name,
      r.roll_no,
      r.batch || '-',
      `Rs. ${r.total_fee}`,
      `Rs. ${r.amount_paid}`,
      `Rs. ${r.remaining}`,
      r.last_payment_date ? new Date(r.last_payment_date).toLocaleDateString('en-IN') : '-'
    ])

    autoTable(doc, {
      startY: 60,
      head: [['Student', 'Roll No', 'Batch', 'Total Fee', 'Paid', 'Remaining', 'Last Payment']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [63, 131, 248] },
    })

    doc.save(`Fee_Audit_Report_Class_${classId}.pdf`)
  }

  const downloadReceipt = (student: StudentFee, payment: PaymentRecord) => {
    const doc = new jsPDF()
    let yPos = 20

    // Coaching Name Header
    doc.setFontSize(22)
    doc.setTextColor(33, 37, 41)
    doc.setFont('helvetica', 'bold')
    doc.text(coachingName || 'FEE RECEIPT', 105, yPos, { align: 'center' })
    yPos += 12

    // Student Details
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Student Name: ${student.name}`, 14, yPos)
    doc.text(`Receipt No: ${payment.receipt_number || 'N/A'}`, 130, yPos)
    yPos += 7
    doc.text(`Roll No: ${student.roll_no}`, 14, yPos)
    doc.text(`Date: ${new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 130, yPos)
    yPos += 7
    doc.text(`Class: ${student.standard}`, 14, yPos)
    doc.text(`Batch: ${student.batch || 'N/A'}`, 130, yPos)
    yPos += 10

    // Current Payment Table
    autoTable(doc, {
      startY: yPos,
      body: [
        ['Fee Payment', `Rs. ${Number(payment.amount).toLocaleString()}`],
        [{ content: 'Amount Paid (This Receipt)', styles: { fontStyle: 'bold' } }, { content: `Rs. ${Number(payment.amount).toLocaleString()}`, styles: { fontStyle: 'bold' } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0] },
      styles: { fontSize: 11, cellPadding: 6 }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 12

    // Payment History Table
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment History (Cumulative)', 14, yPos)
    yPos += 4

    const sortedHistory = [...student.payment_history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.receipt_number || '').localeCompare(b.receipt_number || ''))
    
    let cumulative = 0
    const historyBody = sortedHistory.map(p => {
      cumulative += Number(p.amount)
      return [
        new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        p.receipt_number || '-',
        `Rs. ${Number(p.amount).toLocaleString()}`,
        `Rs. ${cumulative.toLocaleString()}`
      ]
    })

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Receipt No.', 'Amount Paid', 'Cumulative Total']],
      body: historyBody,
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 }
    })

    yPos = (doc as any).lastAutoTable.finalY + 12

    // Fee Summary Table
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Fee Summary (As on this receipt date)', 14, yPos)
    yPos += 4

    const discount = Math.max(0, baseClassFee - student.total_fee)
    const adjustedFee = student.total_fee

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Total Course Fee', `Rs. ${(discount > 0 ? baseClassFee : adjustedFee).toLocaleString()}`],
        ...(discount > 0 ? [[{ content: 'Discount Applied', styles: { textColor: [184, 134, 11] as [number, number, number], fontStyle: 'bold' as const } }, { content: `Rs. ${discount.toLocaleString()}`, styles: { textColor: [184, 134, 11] as [number, number, number], fontStyle: 'bold' as const } }]] : []),
        ['Adjusted Total Fee', `Rs. ${adjustedFee.toLocaleString()}`],
        [{ content: 'Total Paid to Date', styles: { textColor: [0, 128, 0] as [number, number, number], fontStyle: 'bold' as const } }, { content: `Rs. ${Number(student.amount_paid).toLocaleString()}`, styles: { textColor: [0, 128, 0] as [number, number, number], fontStyle: 'bold' as const } }],
        [{ content: 'Remaining Balance', styles: { textColor: (student.remaining > 0 ? [220, 38, 38] : [0, 128, 0]) as [number, number, number], fontStyle: 'bold' as const } }, { content: `Rs. ${Number(student.remaining).toLocaleString()}`, styles: { textColor: (student.remaining > 0 ? [220, 38, 38] : [0, 128, 0]) as [number, number, number], fontStyle: 'bold' as const } }]
      ],
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (discount > 0 && data.row.index === 1) {
          data.cell.styles.fillColor = [255, 253, 240]
        }
      }
    })

    doc.save(`Receipt_${student.name.replace(/\s+/g, '_')}_${payment.receipt_number || 'pdf'}.pdf`)
  }

  const handleDeletePayment = async (receiptNumber: string, amount: number) => {
    if (!selectedStudent || !selectedStudent.fee_id) return
    if (!confirm('Are you sure you want to delete this payment? This will permanently update the total amount paid.')) return

    const newHistory = selectedStudent.payment_history.filter((p: any) => p.receipt_number !== receiptNumber)
    // Safe rupee arithmetic — avoids float drift like 35000 - 3 = 34997
    const newPaid = Math.round(Math.max(0, selectedStudent.amount_paid - amount) * 100) / 100

    const { error } = await supabase
      .from('fees')
      .update({ payment_history: newHistory, amount_paid: newPaid, updated_at: new Date().toISOString() })
      .eq('id', selectedStudent.fee_id)

    if (error) {
      alert(`Error deleting payment: ${error.message}`)
      return
    }

    await fetchRecords()
    setSelectedStudent((prev: any) => prev ? { 
      ...prev, 
      payment_history: newHistory, 
      amount_paid: newPaid, 
      remaining: prev.total_fee > 0 ? prev.total_fee - newPaid : prev.remaining 
    } : null)
  }

  return (
    <div className="space-y-6">

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Class Fee Settings Panel */}
      <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowFeeSettings(!showFeeSettings)}
          className="w-full flex items-center justify-between px-5 py-4 bg-[var(--background)] hover:bg-[var(--sidebar-accent)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[var(--primary)]" />
            <span className="font-semibold text-sm">Class {classId} Fee Settings</span>
            <span className="text-xs text-[var(--muted-foreground)] ml-1">
              (Set global total fee & installments for all Class {classId} students)
            </span>
          </div>
          {showFeeSettings ? <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)]" /> : <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />}
        </button>

        {showFeeSettings && (
          <div className="p-5 border-t border-[var(--border)] bg-[var(--background)] space-y-6">
            {/* Total Fee Input */}
            <div>
              <label className="block text-sm font-semibold mb-2">Total Course Fee (₹) for Class {classId}</label>
              <div className="relative w-72">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={classTotalFee}
                  onChange={e => setClassTotalFee(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 60000"
                  className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>
            </div>

            {/* Installments */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Installment Schedule</h4>
              <div className="space-y-2 mb-3">
                {classInstallments.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)] italic">No installments added yet.</p>
                ) : classInstallments.map((inst, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-[var(--sidebar-accent)] rounded-xl border border-[var(--border)] text-sm">
                    <span className="font-semibold">{inst.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-600 font-bold">₹{Number(inst.amount).toLocaleString()}</span>
                      {inst.due_date && <span className="text-[var(--muted-foreground)] text-xs">{new Date(inst.due_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>}
                      <button onClick={() => removeInstallment(i)} className="text-red-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Installment */}
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
                  <input type="text" value={newInstName} onChange={e => setNewInstName(e.target.value)} placeholder="e.g. Installment 1" className="bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors w-36" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Amount (₹)</label>
                  <input type="text" inputMode="numeric" autoComplete="off" value={newInstAmount} onChange={e => setNewInstAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 20000" className="bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors w-28" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Due Date</label>
                  <input type="date" value={newInstDate} onChange={e => setNewInstDate(e.target.value)} className="bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                </div>
                <button onClick={addInstallment} disabled={!newInstName || !newInstAmount} className="flex items-center gap-1.5 bg-[var(--primary)] text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveClassFee}
                disabled={savingClassFee}
                className="flex items-center gap-2 bg-[var(--primary)] text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {savingClassFee ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Class Fee Settings
              </button>
              {classFeeMsg && <p className="text-sm text-emerald-600 font-medium">{classFeeMsg}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-[var(--primary)]" /><p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider">Total Students</p></div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-500" /><p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider">Paid</p></div>
          <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-orange-500" /><p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider">No Payment</p></div>
          <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><IndianRupee className="w-4 h-4 text-blue-500" /><p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider">Collected</p></div>
          <p className="text-2xl font-bold text-blue-600">₹{stats.totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><IndianRupee className="w-4 h-4 text-amber-500" /><p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wider">Discount Given</p></div>
          <p className="text-2xl font-bold text-amber-600">₹{stats.totalDiscount.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">Class {classId} Students ({filtered.length})</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Click a student to view or edit full fee history.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button 
            onClick={downloadAuditReport}
            className="flex items-center gap-2 bg-[var(--primary)] text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity mr-2"
          >
            <Download className="w-4 h-4" />
            Audit PDF
          </button>
          <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors">
            <option value="All">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input type="text" placeholder="Search name, roll, batch..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-56 bg-[var(--sidebar)] border border-[var(--border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-[var(--sidebar-accent)] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted-foreground)] bg-gradient-to-b from-[var(--background)] to-[var(--sidebar-accent)] rounded-2xl border border-dashed border-[var(--border)]">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-[var(--foreground)]">No students found</p>
          <p className="text-sm mt-1">
            {records.length === 0
              ? classId === 12
                ? <>No Class 12 students found. Students must be in a batch containing &quot;12&quot; (e.g. JEE 12, NEET 12, 12-A).</>
                : <>No Class 11 students found. Students must be in a batch that does NOT contain &quot;12&quot; (e.g. JEE, NEET, CET-A).</>
              : 'Try adjusting your search or batch filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--sidebar)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--background)]/50 border-b border-[var(--border)] text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Student</th>
                  <th className="px-5 py-4 font-semibold">Batch</th>
                  <th className="px-5 py-4 font-semibold">Total Fee</th>
                  <th className="px-5 py-4 font-semibold">Discount</th>
                  <th className="px-5 py-4 font-semibold">Progress</th>
                  <th className="px-5 py-4 font-semibold">Paid</th>
                  <th className="px-5 py-4 font-semibold">Remaining</th>
                  <th className="px-5 py-4 font-semibold">Last Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map(record => {
                  const progress = record.total_fee > 0 ? Math.min(100, Math.round((record.amount_paid / record.total_fee) * 100)) : 0
                  return (
                    <tr key={record.student_id} onClick={() => { 
                      setSelectedStudent(record)
                      setEditingTotalFee(false)
                      setNewStudentTotalFee(record.total_fee.toString())
                      const disc = baseClassFee > record.total_fee ? baseClassFee - record.total_fee : 0
                      setNewStudentDiscount(disc.toString())
                    }} className="hover:bg-[var(--background)]/80 transition-all duration-150 group cursor-pointer">
                      <td className="px-5 py-4">
                        <p className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{record.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Roll: {record.roll_no}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs font-semibold text-[var(--muted-foreground)]">{record.batch || '—'}</span>
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {record.total_fee > 0 ? `₹${Number(record.total_fee).toLocaleString()}` : <span className="text-orange-500 italic text-xs font-semibold">Not Set</span>}
                      </td>
                      <td className="px-5 py-4">
                        {baseClassFee > record.total_fee && record.total_fee > 0 ? (
                           <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 text-xs">₹{(baseClassFee - record.total_fee).toLocaleString()}</span>
                        ) : (
                           <span className="text-[var(--muted-foreground)] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 w-40">
                        {record.total_fee > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-full h-2 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                              <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-[var(--muted-foreground)] w-8">{progress}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--muted-foreground)] italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {record.has_payment ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">₹{Number(record.amount_paid).toLocaleString()}</span>
                        ) : (
                          <span className="text-[var(--muted-foreground)] text-xs font-medium px-2 py-1 rounded-md bg-[var(--background)] border border-[var(--border)]">₹0</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {record.total_fee > 0 ? (
                          <span className={`font-bold text-sm ${record.remaining > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                            {record.remaining > 0 ? `₹${Number(record.remaining).toLocaleString()}` : '✓ Cleared'}
                          </span>
                        ) : <span className="text-[var(--muted-foreground)] text-xs">—</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--muted-foreground)]">
                        {record.last_payment_date ? new Date(record.last_payment_date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : <span className="italic">Never</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
          <div className="relative w-full max-w-3xl bg-[var(--background)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--sidebar)]">
              <div>
                <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Roll: {selectedStudent.roll_no} • Class {selectedStudent.standard} • Batch: {selectedStudent.batch || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-full hover:bg-[var(--sidebar-accent)] text-[var(--muted-foreground)] transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Total Fee — editable */}
                <div className="bg-[var(--sidebar-accent)]/50 rounded-xl p-4 border border-[var(--border)] group relative">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-[var(--muted-foreground)] font-medium">TOTAL FEE</p>
                    {!editingTotalFee && (
                      <button onClick={() => {
                        setEditingTotalFee(true)
                        const disc = baseClassFee > selectedStudent.total_fee ? baseClassFee - selectedStudent.total_fee : 0
                        setNewStudentDiscount(disc.toString())
                      }} className="text-[var(--primary)] hover:bg-[var(--primary)]/10 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors border border-[var(--primary)]/30 bg-[var(--primary)]/5">
                        <Edit2 className="w-3.5 h-3.5" /> Adjust Fee / Discount
                      </button>
                    )}
                  </div>
                  {editingTotalFee ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--muted-foreground)] w-16">Discount:</label>
                        <div className="relative flex-1">
                          <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                          <input type="text" inputMode="numeric" autoComplete="off" value={newStudentDiscount} 
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              setNewStudentDiscount(val)
                              const discNum = parseFloat(val) || 0
                              setNewStudentTotalFee(Math.max(0, baseClassFee - discNum).toString())
                            }} 
                            placeholder="e.g. 10000"
                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md pl-7 pr-2 py-1 text-sm focus:border-[var(--primary)] focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[var(--muted-foreground)] w-16">Final Fee:</label>
                        <div className="relative flex-1">
                          <IndianRupee className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                          <input type="text" inputMode="numeric" autoComplete="off" value={newStudentTotalFee} 
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              setNewStudentTotalFee(val)
                              const feeNum = parseFloat(val) || 0
                              setNewStudentDiscount(Math.max(0, baseClassFee - feeNum).toString())
                            }} 
                            className="w-full bg-[var(--background)] border border-[var(--primary)] rounded-md pl-7 pr-2 py-1 text-sm font-bold focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <button onClick={handleUpdateStudentFee} disabled={savingStudentFee} className="px-3 py-1.5 text-xs bg-[var(--primary)] text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-1">
                          {savingStudentFee ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save
                        </button>
                        <button onClick={() => setEditingTotalFee(false)} className="px-3 py-1.5 text-xs bg-[var(--sidebar)] text-[var(--foreground)] border border-[var(--border)] rounded-md hover:bg-[var(--sidebar-accent)]">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-bold">{selectedStudent.total_fee > 0 ? `₹${Number(selectedStudent.total_fee).toLocaleString()}` : <span className="text-orange-500 text-base">Not Set</span>}</p>
                      {baseClassFee > selectedStudent.total_fee && selectedStudent.total_fee > 0 && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          (₹{(baseClassFee - selectedStudent.total_fee).toLocaleString()} Discount)
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <p className="text-xs text-emerald-600 font-medium mb-1">AMOUNT PAID</p>
                  <p className="text-xl font-bold text-emerald-600">₹{Number(selectedStudent.amount_paid).toLocaleString()}</p>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <p className="text-xs text-red-500 font-medium mb-1">REMAINING</p>
                  <p className="text-xl font-bold text-red-500">{selectedStudent.total_fee > 0 ? `₹${Number(selectedStudent.remaining).toLocaleString()}` : '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Payment History */}
                <div>
                  <h4 className="font-bold flex items-center gap-2 mb-4"><History className="w-4 h-4 text-[var(--primary)]" />Payment History</h4>
                  {selectedStudent.payment_history.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)] italic p-4 bg-[var(--sidebar)] rounded-xl border border-dashed border-[var(--border)] text-center">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {[...selectedStudent.payment_history].sort((a, b) => {
                        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
                        if (dateDiff !== 0) return dateDiff
                        // Same day: receipt_number contains Date.now() — higher = newer
                        return (b.receipt_number || '').localeCompare(a.receipt_number || '')
                      }).map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center"><IndianRupee className="w-4 h-4 text-emerald-500" /></div>
                            <div>
                              <p className="font-bold text-emerald-600">₹{Number(p.amount).toLocaleString()}</p>
                              <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">{p.receipt_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-[var(--muted-foreground)] text-right">
                              {new Date(p.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => downloadReceipt(selectedStudent, p)}
                                className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                                title="Download Receipt"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(p.receipt_number ?? '', Number(p.amount))}
                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                title="Delete Payment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Installments */}
                <div>
                  <h4 className="font-bold flex items-center gap-2 mb-4"><Calendar className="w-4 h-4 text-[var(--primary)]" />Installment Status</h4>
                  {selectedStudent.installments.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)] italic p-4 bg-[var(--sidebar)] rounded-xl border border-dashed border-[var(--border)] text-center">No installments configured. Set them in Class Fee Settings above.</p>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        let remaining = Number(selectedStudent.amount_paid)
                        return selectedStudent.installments.map((inst: any, i: number) => {
                          const amt = Number(inst.amount)
                          const isCleared = remaining >= amt
                          const isPartial = !isCleared && remaining > 0
                          remaining = Math.max(0, remaining - amt)
                          return (
                            <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${isCleared ? 'bg-emerald-500/5 border-emerald-500/20' : isPartial ? 'bg-blue-500/5 border-blue-500/20' : 'bg-[var(--sidebar)] border-[var(--border)]'}`}>
                              <div className="flex items-center gap-3">
                                {isCleared ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Clock className={`w-5 h-5 ${isPartial ? 'text-blue-500' : 'text-[var(--muted-foreground)]'}`} />}
                                <div>
                                  <p className={`font-semibold text-sm ${isCleared ? 'text-emerald-600' : isPartial ? 'text-blue-500' : ''}`}>{inst.name}</p>
                                  {inst.due_date && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Due: {new Date(inst.due_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>}
                                </div>
                              </div>
                              <p className="font-bold text-sm">₹{amt.toLocaleString()}</p>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--sidebar)] text-center">
              <button onClick={() => setSelectedStudent(null)} className="px-6 py-2 bg-[var(--primary)] text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
