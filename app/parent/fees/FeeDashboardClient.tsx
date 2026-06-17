'use client'

import { Download, Wallet, CreditCard, Banknote, CalendarCheck, Clock } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Installment = {
  name: string
  amount: number
  due_date: string
}

type Payment = {
  amount: number
  date: string
  receipt_number: string
}

type FeeData = {
  instituteName: string
  studentName: string
  rollNo: string
  standard: number
  batch: string
  totalFee: number
  amountPaid: number
  remainingFee: number
  installments: Installment[]
  payments: Payment[]
  currentInstallment: Installment | null
}

export default function FeeDashboardClient({ data }: { data: FeeData }) {
  const progress = data.totalFee > 0 ? Math.min(100, Math.round((data.amountPaid / data.totalFee) * 100)) : 0

  const handleDownloadReceipt = (payment: Payment & {
    paid_to_date?: number
    total_fee_at_time?: number
    remaining_at_time?: number
  }) => {
    const doc = new jsPDF()

    // ── FROZEN SNAPSHOT ─────────────────────────────────────
    // Use values frozen at the moment this payment was recorded.
    // Falls back to live totals only for old payments (before this fix was deployed).
    const paidToDate    = payment.paid_to_date     ?? data.amountPaid
    const totalFeeSnap  = payment.total_fee_at_time ?? data.totalFee
    const remainingSnap = payment.remaining_at_time ?? Math.max(0, data.totalFee - data.amountPaid)

    const paymentDate = new Date(payment.date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    })

    // ── HEADER ───────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(20, 20, 20)
    doc.text(data.instituteName, 105, 20, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('FEE RECEIPT', 105, 28, { align: 'center' })

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.4)
    doc.line(14, 33, 196, 33)

    // Receipt No + Date
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.text(`Receipt No: ${payment.receipt_number}`, 14, 40)
    doc.text(`Date: ${paymentDate}`, 196, 40, { align: 'right' })
    doc.line(14, 44, 196, 44)

    // ── STUDENT DETAILS ──────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Student Details', 14, 52)

    autoTable(doc, {
      startY: 55,
      theme: 'plain',
      styles: { cellPadding: 1.5, fontSize: 10, textColor: [30, 30, 30] },
      body: [
        ['Name', data.studentName, 'Standard', `Class ${data.standard || 'N/A'}`],
        ['Roll No', String(data.rollNo), 'Batch', data.batch],
      ],
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26, textColor: [90, 90, 90] },
        2: { fontStyle: 'bold', cellWidth: 26, textColor: [90, 90, 90] },
      },
    })

    // ── THIS PAYMENT ─────────────────────────────────────────
    const y1 = (doc as any).lastAutoTable.finalY + 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Payment Details', 14, y1)

    autoTable(doc, {
      startY: y1 + 4,
      theme: 'grid',
      headStyles: { fillColor: [28, 78, 160], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 3 },
      head: [['Description', 'Amount']],
      body: [
        ['Fee Payment', `Rs. ${Number(payment.amount).toLocaleString('en-IN')}`],
        [
          { content: 'Amount Paid (This Receipt)', styles: { fontStyle: 'bold' } },
          { content: `Rs. ${Number(payment.amount).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
        ],
      ],
    })

    // ── PAYMENT HISTORY (all payments up to & including this one) ────────
    // Sort chronologically oldest-first; receipt_number tiebreaks same-day payments
    const allPayments = [...(data.payments || [])].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return (a.receipt_number || '').localeCompare(b.receipt_number || '')
    })
    const thisIndex = allPayments.findIndex(p => p.receipt_number === payment.receipt_number)
    const historyUpto = thisIndex >= 0 ? allPayments.slice(0, thisIndex + 1) : [payment]

    if (historyUpto.length > 1) {
      const y2 = (doc as any).lastAutoTable.finalY + 7
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      doc.text('Payment History (Cumulative)', 14, y2)

      let running = 0
      const histRows = historyUpto.map(p => {
        running += Number(p.amount)
        return [
          new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          p.receipt_number,
          `Rs. ${Number(p.amount).toLocaleString('en-IN')}`,
          `Rs. ${running.toLocaleString('en-IN')}`,
        ]
      })

      autoTable(doc, {
        startY: y2 + 4,
        theme: 'striped',
        headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 2.5 },
        head: [['Date', 'Receipt No.', 'Amount Paid', 'Cumulative Total']],
        body: histRows,
      })
    }

    // ── FEE SUMMARY (FROZEN SNAPSHOT) ────────────────────────
    const y3 = (doc as any).lastAutoTable.finalY + 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('Fee Summary (As on this receipt date)', 14, y3)

    autoTable(doc, {
      startY: y3 + 4,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      body: [
        [
          'Total Course Fee',
          totalFeeSnap > 0
            ? `Rs. ${Number(totalFeeSnap).toLocaleString('en-IN')}`
            : 'Not Set'
        ],
        [
          { content: 'Total Paid to Date', styles: { fontStyle: 'bold', textColor: [0, 120, 60] } },
          { content: `Rs. ${Number(paidToDate).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: [0, 120, 60] } },
        ],
        [
          { content: 'Remaining Balance', styles: { fontStyle: 'bold', textColor: totalFeeSnap > 0 ? (remainingSnap > 0 ? [180, 60, 0] : [0, 120, 60]) : [120, 120, 120] } },
          { content: totalFeeSnap > 0 ? `Rs. ${Number(remainingSnap).toLocaleString('en-IN')}` : '—', styles: { fontStyle: 'bold', textColor: totalFeeSnap > 0 ? (remainingSnap > 0 ? [180, 60, 0] : [0, 120, 60]) : [120, 120, 120] } },
        ],
      ],
      columnStyles: { 0: { cellWidth: 120 } },
    })

    // ── FOOTER ───────────────────────────────────────────────
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, 282, { align: 'center' })
    doc.text(data.instituteName, 105, 287, { align: 'center' })

    doc.save(`${data.studentName}_Receipt_${payment.receipt_number}.pdf`)
  }

  // Calculate installment statuses from JSONB
  let cumulativePaid = data.amountPaid
  const enrichedInstallments = data.installments.map((inst, i) => {
    const instAmount = Number(inst.amount)
    let status = 'Pending'
    if (cumulativePaid >= instAmount) {
      status = 'Paid'
      cumulativePaid -= instAmount
    } else if (cumulativePaid > 0) {
      status = 'Partial'
      cumulativePaid = 0
    } else if (inst.due_date && new Date(inst.due_date).getTime() < new Date().getTime()) {
      status = 'Overdue'
    }
    return { ...inst, status, key: i }
  })

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Fee */}
        <div className="bg-gradient-to-br from-[#1a2540] to-[#0f1729] border border-slate-700/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-blue-500/20" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
              <Banknote className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Fee</h3>
          </div>
          <div className="text-3xl font-bold text-white relative z-10 tracking-tight">
            {data.totalFee > 0 ? `₹${data.totalFee.toLocaleString()}` : <span className="text-orange-400 text-xl">Not Set</span>}
          </div>
        </div>

        {/* Amount Paid */}
        <div className="bg-gradient-to-br from-[#1a2540] to-[#0f1729] border border-slate-700/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-green-500/20" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 shadow-inner">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Amount Paid</h3>
          </div>
          <div className="text-3xl font-bold text-white relative z-10 tracking-tight">₹{data.amountPaid.toLocaleString()}</div>
        </div>

        {/* Remaining Fee */}
        <div className="bg-gradient-to-br from-[#1a2540] to-[#0f1729] border border-slate-700/50 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-orange-500/20" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Remaining Fee</h3>
          </div>
          <div className="text-3xl font-bold text-white relative z-10 tracking-tight">
            {data.totalFee > 0 ? `₹${data.remainingFee.toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      {/* CURRENT INSTALLMENT BANNER */}
      {data.currentInstallment && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Current Installment Due</p>
            <p className="text-white font-bold text-lg">{data.currentInstallment.name} — ₹{Number(data.currentInstallment.amount).toLocaleString()}</p>
            {data.currentInstallment.due_date && (
              <p className="text-amber-300/70 text-sm mt-0.5">
                Due: {new Date(data.currentInstallment.due_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* FEE PROGRESS */}
      <div className="bg-[#1a2540]/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-lg">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Payment Progress</h3>
            <p className="text-sm text-slate-400">Track your overall fee completion</p>
          </div>
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">{progress}% Paid</span>
        </div>
        <div className="w-full h-4 bg-slate-900/50 rounded-full overflow-hidden border border-slate-800/50 p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-teal-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* INSTALLMENTS TABLE */}
        <div className="bg-[#1a2540]/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Installments</h2>
            </div>
          </div>
          {enrichedInstallments.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Installment</th>
                    <th className="px-6 py-4 font-semibold">Due Date</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {enrichedInstallments.map((inst) => (
                    <tr key={inst.key} className="hover:bg-slate-800/40 transition-all duration-200">
                      <td className="px-6 py-4 font-medium text-white">{inst.name}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {inst.due_date ? new Date(inst.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric'}) : '—'}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">₹{Number(inst.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                          inst.status === 'Paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-green-500/5' :
                          inst.status === 'Partial' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/5' :
                          inst.status === 'Overdue' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-red-500/5' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <CalendarCheck className="w-8 h-8 text-slate-600" />
              </div>
              <p>No installments configured yet.</p>
            </div>
          )}
        </div>

        {/* PAYMENT HISTORY TABLE */}
        <div className="bg-[#1a2540]/60 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Payment History</h2>
            </div>
          </div>
          {data.payments.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date Paid</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.payments.map((payment, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-all duration-200">
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric'})}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-500/10 text-green-400 font-bold border border-green-500/20">
                          ₹{Number(payment.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(payment)}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-xs">Download PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <CreditCard className="w-8 h-8 text-slate-600" />
              </div>
              <p>No payments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
