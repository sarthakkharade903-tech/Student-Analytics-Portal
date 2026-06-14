'use client'

import { useState, useEffect, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, User, CheckCircle, ArrowRight, IndianRupee, X, Loader2 } from 'lucide-react'

type StudentSearch = {
  id: string
  name: string
  roll_no: string
  batch: string
  total_fee?: number
  amount_paid?: number
  fee_record_id?: string
  payment_history?: any[]
}

export default function QuickFeeEntryPage({ params }: { params: Promise<{ classId: string }> }) {
  const unwrappedParams = use(params)
  const classId = parseInt(unwrappedParams.classId)
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StudentSearch[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearch | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)

  const [amountPaid, setAmountPaid] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Recent payments list
  const [recentPayments, setRecentPayments] = useState<any[]>([])

  const loadRecentPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user.id).single()
    if (!profile) return

    // Since payment_history is JSONB, we just fetch the recently updated fee records
    const { data } = await supabase
      .from('fees')
      .select('id, amount_paid, payment_history, updated_at, students(name, roll_no)')
      .eq('coaching_center_id', profile.coaching_center_id)
      .order('updated_at', { ascending: false })
      .limit(10)

    if (data) {
      // Extract the latest payment from each record
      const recent = data.map((record: any) => {
        const history = record.payment_history || []
        if (history.length === 0) return null
        
        // Sort history by date desc
        const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const latest = sorted[0]
        
        return {
          id: record.id + '_' + latest.receipt_number,
          student_name: (record.students as any)?.name,
          roll_no: (record.students as any)?.roll_no,
          amount: latest.amount,
          date: latest.date,
          receipt_number: latest.receipt_number,
          updated_at: new Date(record.updated_at).getTime()
        }
      }).filter(Boolean)
      
      // Sort globally across students
      recent.sort((a: any, b: any) => b.updated_at - a.updated_at)
      
      setRecentPayments(recent.slice(0, 5))
    }
  }

  useEffect(() => {
    loadRecentPayments()
  }, [classId])

  // Realtime search with debounce
  useEffect(() => {
    if (query.trim().length < 1) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user.id).single()
      if (!profile?.coaching_center_id) return

      let studentQuery = supabase
        .from('students')
        .select('id, name, roll_no, batch')
        .eq('coaching_center_id', profile.coaching_center_id)
        .or(`name.ilike.%${query}%,roll_no.ilike.%${query}%`)
        .limit(8)

      // Filter by class based on batch name pattern
      if (classId === 12) {
        studentQuery = studentQuery.ilike('batch', '%12%')
      } else {
        studentQuery = studentQuery.not('batch', 'ilike', '%12%')
      }

      const { data } = await studentQuery

      setSearchResults(data || [])
      setShowDropdown(true)
      setSearching(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [query, classId])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectStudent = async (student: StudentSearch) => {
    // Fetch fee info
    const { data: record } = await supabase
      .from('fees')
      .select('id, total_fee, amount_paid, payment_history')
      .eq('student_id', student.id)
      .maybeSingle()

    setSelectedStudent({
      ...student,
      fee_record_id: record?.id,
      total_fee: record?.total_fee || 0,
      amount_paid: record?.amount_paid || 0,
      payment_history: record?.payment_history || []
    })
    setQuery('')
    setSearchResults([])
    setShowDropdown(false)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !amountPaid || isNaN(Number(amountPaid))) return

    setLoading(true)
    setMessage(null)

    const amount = parseFloat(amountPaid)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user!.id).single()
      const centerId = profile!.coaching_center_id

      const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
      
      const newPayment = {
        amount,
        date: paymentDate,
        receipt_number: receiptNumber
      }

      if (selectedStudent.fee_record_id) {
        // Update existing fee record
        const updatedHistory = [...(selectedStudent.payment_history || []), newPayment]
        const newTotalPaid = Number(selectedStudent.amount_paid || 0) + amount
        
        const { error } = await supabase
          .from('fees')
          .update({
            amount_paid: newTotalPaid,
            payment_history: updatedHistory,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedStudent.fee_record_id)
          
        if (error) throw error
      } else {
        // Insert new fee record
        const { error } = await supabase
          .from('fees')
          .insert({
            coaching_center_id: centerId,
            student_id: selectedStudent.id,
            total_fee: 0, // Admin must set this manually via details modal
            amount_paid: amount,
            payment_history: [newPayment],
            installments: []
          })
          
        if (error) throw error
      }

      setMessage({ type: 'success', text: `✓ Payment of ₹${amount.toLocaleString()} recorded! Receipt: ${receiptNumber}` })

      // Reset form
      setSelectedStudent(null)
      setAmountPaid('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      loadRecentPayments()

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred.' })
    }

    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left: Form */}
      <div className="lg:col-span-3">
        <h2 className="text-xl font-bold mb-2">Quick Fee Entry</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">Search a student and record their payment instantly.</p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-600 border-green-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}>
            {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student Search */}
          <div>
            <label className="block text-sm font-semibold mb-2">Student Roll Number or Name</label>
            {selectedStudent ? (
              <div className="flex items-center justify-between bg-[var(--sidebar)] border-2 border-[var(--primary)] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center text-[var(--primary)] font-bold text-sm">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--foreground)]">{selectedStudent.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Roll: {selectedStudent.roll_no} · Batch: {selectedStudent.batch}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Paid so far: <span className="text-emerald-600 font-semibold">₹{Number(selectedStudent.amount_paid || 0).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type student name or roll number..."
                    autoComplete="off"
                    className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] animate-spin" />}
                </div>

                {showDropdown && (
                  <div className="absolute z-30 w-full mt-2 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
                    {searchResults.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-[var(--muted-foreground)] text-center">No students found for "{query}"</div>
                    ) : (
                      searchResults.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onMouseDown={() => handleSelectStudent(student)}
                          className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-[var(--sidebar-accent)] border-b border-[var(--border)] last:border-0 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center text-[var(--primary)] font-bold text-xs flex-shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[var(--foreground)]">{student.name}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">Roll: {student.roll_no} · {student.batch}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold mb-2">Amount Paid (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="e.g. 15000"
                min="1"
                step="1"
                required
                className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedStudent || !amountPaid || loading}
            className="w-full bg-[var(--primary)] text-primary-foreground font-semibold rounded-xl py-3.5 px-4 hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <>Record Payment <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>

      {/* Right: Recent Payments */}
      <div className="lg:col-span-2">
        <h3 className="font-bold text-sm mb-4 text-[var(--muted-foreground)] uppercase tracking-wider">Recent Payments</h3>
        {recentPayments.length === 0 ? (
          <div className="bg-[var(--background)] border border-dashed border-[var(--border)] rounded-xl p-6 text-center text-sm text-[var(--muted-foreground)]">
            No recent payments
          </div>
        ) : (
          <div className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/40 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <IndianRupee className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">{p.student_name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Roll: {p.roll_no}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-600">₹{Number(p.amount).toLocaleString()}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{new Date(p.date).toLocaleDateString('en-IN', { dateStyle: 'short' })}</p>
                  </div>
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-2 font-mono">{p.receipt_number}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
