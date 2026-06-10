import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceClient from './AttendanceClient'

export const metadata = {
  title: 'Attendance | Student Analytics Portal',
}

export default async function AttendancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  if (!profile?.coaching_center_id) {
    redirect('/login')
  }

  return <AttendanceClient coachingCenterId={profile.coaching_center_id} />
}
