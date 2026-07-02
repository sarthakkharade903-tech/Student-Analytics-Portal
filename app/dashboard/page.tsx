import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard',
  description: 'Overview of your coaching center performance.',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // ── Auth ────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── User profile + coaching center ──────────────────────────────────────
  const { data: userProfile } = await supabase
    .from('users')
    .select('name, coaching_center_id')
    .eq('id', user.id)
    .single()

  const centerId = userProfile?.coaching_center_id

  // ── Run all queries in parallel (11th is the default tab) ───────────────
  const [
    { data: coachingCenter },
    { count: studentCount },
    { count: testCount },
    { data: stdStudents },
    { data: recentStudents },
    { data: recentFees },
    { data: centerForSub },
  ] = await Promise.all([
    centerId
      ? supabase.from('coaching_centers').select('name').eq('id', centerId).single()
      : Promise.resolve({ data: null }),
    centerId
      ? supabase.from('students').select('id', { count: 'exact', head: true }).eq('coaching_center_id', centerId).eq('standard', '11th')
      : Promise.resolve({ count: 0 }),
    centerId
      ? supabase.from('tests').select('id', { count: 'exact', head: true }).eq('coaching_center_id', centerId).eq('standard', '11th')
      : Promise.resolve({ count: 0 }),
    centerId
      ? supabase.from('students').select('id, batch').eq('coaching_center_id', centerId).eq('standard', '11th')
      : Promise.resolve({ data: [] }),
    // Notifications: admissions in last 7 days
    centerId
      ? supabase.from('students').select('id, name, created_at, batch, standard')
          .eq('coaching_center_id', centerId)
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    // Notifications: recent fee payments
    centerId
      ? supabase.from('fees').select('id, student_id, updated_at, amount_paid')
          .eq('coaching_center_id', centerId)
          .gte('updated_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .gt('amount_paid', 0)
          .order('updated_at', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    // Subscription check
    centerId
      ? supabase.from('coaching_centers').select('end_date').eq('id', centerId).single()
      : Promise.resolve({ data: null }),
  ])

  // ── Attendance rate ──────────────────────────────────────────────────────
  let attendanceRate = '--'
  const studentIds = (stdStudents ?? []).map((s: { id: string }) => s.id)
  if (studentIds.length > 0 && centerId) {
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('is_present')
      .eq('coaching_center_id', centerId)
      .in('student_id', studentIds)

    if (attendanceData && attendanceData.length > 0) {
      const presentCount = attendanceData.filter((a: { is_present: boolean }) => a.is_present).length
      attendanceRate = Math.round((presentCount / attendanceData.length) * 100) + '%'
    }
  }

  // ── Active batches ──────────────────────────────────────────────────────
  const batches = new Set<string>()
  if (stdStudents) {
    stdStudents.forEach((s: any) => { if (s.batch) batches.add(s.batch) })
  }

  // ── Build notifications ──────────────────────────────────────────────────
  const notifications: any[] = []

  if (recentStudents) {
    recentStudents.forEach((student: any) => {
      notifications.push({
        id: `adm-${student.id}`,
        type: 'ADMISSION',
        title: 'New Admission',
        message: `${student.name} was admitted to Class ${student.standard} (${student.batch || 'No batch'}).`,
        timestamp: student.created_at,
        isRead: false,
      })
    })
  }

  if (recentFees && recentFees.length > 0 && centerId) {
    const feeStudentIds = recentFees.map((f: any) => f.student_id)
    const { data: feeStudents } = await supabase
      .from('students').select('id, name').in('id', feeStudentIds)
    const studentMap = new Map((feeStudents || []).map((s: any) => [s.id, s.name]))
    recentFees.forEach((fee: any) => {
      notifications.push({
        id: `fee-${fee.id}-${fee.updated_at}`,
        type: 'FEE',
        title: 'Fee Collected',
        message: `Fee payment recorded for ${studentMap.get(fee.student_id) || 'A student'}. Total paid: ₹${fee.amount_paid.toLocaleString()}`,
        timestamp: fee.updated_at,
        isRead: false,
      })
    })
  }

  if (centerForSub?.end_date) {
    const diffDays = Math.ceil((new Date(centerForSub.end_date).getTime() - Date.now()) / 86400000)
    if (diffDays >= 0 && diffDays <= 15) {
      notifications.push({ id: 'sub-warning', type: 'SUBSCRIPTION', title: 'Subscription Expiring Soon', message: `Your plan expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}. Please renew to avoid interruption.`, timestamp: new Date().toISOString(), isRead: false })
    } else if (diffDays < 0) {
      notifications.push({ id: 'sub-expired', type: 'SUBSCRIPTION', title: 'Subscription Expired', message: `Your subscription has expired ${Math.abs(diffDays)} day(s) ago.`, timestamp: new Date().toISOString(), isRead: false })
    }
  }

  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardClient
      initialData={{
        displayName: userProfile?.name ?? user.email ?? 'there',
        centerName: coachingCenter?.name ?? 'your institute',
        studentCount: studentCount ?? 0,
        testCount: testCount ?? 0,
        attendanceRate,
        activeBatches: batches.size,
      }}
      initialNotifications={notifications.slice(0, 20)}
    />
  )
}
