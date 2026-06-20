import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceClient from './AttendanceClient'

export const metadata = {
  title: 'Attendance',
  description: 'Track and manage student attendance.',
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ std?: string }>
}) {
  const { std: stdParam } = await searchParams
  const standard = stdParam === '12th' ? '12th' : '11th'

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

  return <AttendanceClient coachingCenterId={profile.coaching_center_id} standard={standard} />
}
