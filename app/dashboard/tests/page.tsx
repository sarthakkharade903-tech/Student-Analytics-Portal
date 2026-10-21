import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TestsClient from './TestsClient'
import StandardTabs from '@/components/dashboard/StandardTabs'

export const metadata = {
  title: 'Tests',
  description: 'Manage and upload test results for your coaching center.',
}

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ std?: string }>
}) {
  const { std: stdParam } = await searchParams
  const standard = stdParam === '12th' ? '12th' : '11th'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get admin profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  const coachingCenterId = userProfile?.coaching_center_id

  let batches: string[] = []
  if (coachingCenterId) {
    // Fetch distinct batches
    const { data: students } = await supabase
      .from('students')
      .select('batch')
      .eq('coaching_center_id', coachingCenterId)
      .eq('standard', standard)

    const batchSet = new Set<string>()
    students?.forEach((s) => {
      if (s.batch) batchSet.add(s.batch)
    })
    batches = Array.from(batchSet).sort()
  }

  return (
    <div>
      <TestsClient batches={batches} />
    </div>
  )
}

