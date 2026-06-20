import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type NotificationType = 'ADMISSION' | 'FEE' | 'SUBSCRIPTION'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  isRead: boolean
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userProfile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  const centerId = userProfile?.coaching_center_id
  if (!centerId) return NextResponse.json({ notifications: [] })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString()

  // Fetch recent admissions
  const { data: recentStudents } = await supabase
    .from('students')
    .select('id, name, created_at, batch, standard')
    .eq('coaching_center_id', centerId)
    .gte('created_at', sevenDaysAgoStr)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch recent fee updates
  const { data: recentFees } = await supabase
    .from('fees')
    .select('id, student_id, updated_at, amount_paid, payment_history')
    .eq('coaching_center_id', centerId)
    .gte('updated_at', sevenDaysAgoStr)
    .gt('amount_paid', 0)
    .order('updated_at', { ascending: false })
    .limit(10)

  // Fetch subscription end date
  const { data: coachingCenter } = await supabase
    .from('coaching_centers')
    .select('end_date')
    .eq('id', centerId)
    .single()

  const notifications: AppNotification[] = []

  // Add Admissions
  if (recentStudents) {
    recentStudents.forEach((student) => {
      notifications.push({
        id: `adm-${student.id}`,
        type: 'ADMISSION',
        title: 'New Admission',
        message: `${student.name} was admitted to Class ${student.standard} (${student.batch || 'No batch'}).`,
        timestamp: student.created_at,
        isRead: false
      })
    })
  }

  // Add Fee Collections (deduping by getting the latest payment if using payment_history, or just generic message)
  if (recentFees) {
    // We need to fetch student names for the fees
    if (recentFees.length > 0) {
      const studentIds = recentFees.map(f => f.student_id)
      const { data: feeStudents } = await supabase
        .from('students')
        .select('id, name')
        .in('id', studentIds)
      
      const studentMap = new Map((feeStudents || []).map(s => [s.id, s.name]))

      recentFees.forEach((fee) => {
        const studentName = studentMap.get(fee.student_id) || 'A student'
        notifications.push({
          id: `fee-${fee.id}-${fee.updated_at}`,
          type: 'FEE',
          title: 'Fee Collected',
          message: `Fee payment recorded for ${studentName}. Total paid: ₹${fee.amount_paid.toLocaleString()}`,
          timestamp: fee.updated_at,
          isRead: false
        })
      })
    }
  }

  // Check Subscription
  if (coachingCenter?.end_date) {
    const endDate = new Date(coachingCenter.end_date)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays >= 0 && diffDays <= 15) {
      notifications.push({
        id: 'sub-warning',
        type: 'SUBSCRIPTION',
        title: 'Subscription Expiring Soon',
        message: `Your coaching institute's plan expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}. Please renew to avoid interruption.`,
        timestamp: new Date().toISOString(),
        isRead: false
      })
    } else if (diffDays < 0) {
      notifications.push({
        id: 'sub-expired',
        type: 'SUBSCRIPTION',
        title: 'Subscription Expired',
        message: `Your subscription has expired ${Math.abs(diffDays)} day(s) ago.`,
        timestamp: new Date().toISOString(),
        isRead: false
      })
    }
  }

  // Sort by timestamp descending
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({ notifications: notifications.slice(0, 20) })
}
