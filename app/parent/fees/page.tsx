import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { createServerClient } from '@supabase/ssr'
import FeeDashboardClient from './FeeDashboardClient'

export const metadata = {
  title: 'Fees',
  description: 'View your fee summary, installments, and payment history.'
}

export default async function ParentFeesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value

  if (!token) redirect('/parent/login')

  let studentId = ''
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
    )
    const { payload } = await jwtVerify(token, secret)
    studentId = payload.student_id as string
  } catch {
    redirect('/parent/login')
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Fetch Student
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (!student) redirect('/parent/login')

  // coaching_center_id points to the coaching_centers table — NOT users.name
  // Same pattern used by dashboard API and tests pages
  const { data: coachingCenter } = await supabase
    .from('coaching_centers')
    .select('name')
    .eq('id', student.coaching_center_id)
    .single()

  // Fetch Fee Record from the SINGLE fees table
  const { data: feeRecord } = await supabase
    .from('fees')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()

  // Extract just the number from standard (e.g. "12th" -> 12)
  const numericStandard = parseInt(String(student.standard).replace(/\D/g, '')) || 0

  // Fetch Class Fee Settings for fallback
  const { data: classFeeSettings } = await supabase
    .from('class_fee_settings')
    .select('*')
    .eq('coaching_center_id', student.coaching_center_id)
    .eq('standard', numericStandard)
    .maybeSingle()

  const classFallbackFee = classFeeSettings?.total_fee || 0
  const classFallbackInst = classFeeSettings?.installments || []

  const totalFee = (feeRecord?.total_fee && feeRecord.total_fee > 0) ? feeRecord.total_fee : classFallbackFee
  const amountPaid = feeRecord?.amount_paid || 0
  const installments: any[] = (feeRecord?.installments && feeRecord.installments.length > 0) ? feeRecord.installments : classFallbackInst
  
  // payment_history is stored as JSONB: [{ amount, date, receipt_number }]
  const rawHistory: any[] = feeRecord?.payment_history || []

  // Sort newest first; use receipt_number as tiebreaker for same-day payments
  // (receipt_number contains Date.now() so it's naturally chronological)
  const payments = [...rawHistory].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    if (dateDiff !== 0) return dateDiff
    return (b.receipt_number || '').localeCompare(a.receipt_number || '')
  })

  // Find current installment (first unpaid one)
  let cumulativePaid = amountPaid
  let currentInstallment = null
  for (const inst of installments) {
    if (cumulativePaid >= inst.amount) {
      cumulativePaid -= inst.amount
    } else {
      currentInstallment = inst
      break
    }
  }

  const data = {
    instituteName: coachingCenter?.name || 'Coaching Institute',
    studentName: student.name,
    rollNo: student.roll_no,
    standard: student.standard,
    batch: student.batch,
    totalFee,
    amountPaid,
    remainingFee: totalFee - amountPaid,
    installments,
    payments,
    currentInstallment
  }

  return (
    <div className="pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fee Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">View your fee summary, installments, and payment history.</p>
        </div>
      </div>
      <FeeDashboardClient data={data} />
    </div>
  )
}
