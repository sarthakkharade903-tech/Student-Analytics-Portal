import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export const metadata = {
  title: 'Analytics',
}

export default async function AnalyticsPage({
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

  if (!profile?.coaching_center_id) redirect('/dashboard')

  // --- Fetch At-Risk Students via RPC ---
  const { data: atRiskStudents } = await supabase
    .rpc('get_at_risk_students', { 
      p_center_id: profile.coaching_center_id,
      p_standard: standard
    })

  return (
    <AnalyticsClient
      coachingCenterId={profile.coaching_center_id}
      atRiskStudents={atRiskStudents || []}
    />
  )
}
