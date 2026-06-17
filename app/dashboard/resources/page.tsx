import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResourcesClient from './ResourcesClient'
import StandardTabs from '@/components/dashboard/StandardTabs'

export default async function ResourcesPage({
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

  // Get admin profile (matches pattern used by all other dashboard pages)
  const { data: userProfile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.coaching_center_id) {
    return (
      <div className="p-6 text-[var(--muted-foreground)] text-sm">
        No coaching center found for your account. Please check your settings.
      </div>
    )
  }

  const coachingCenterId = userProfile.coaching_center_id

  // Fetch distinct batches for the target batch dropdown
  const { data: students } = await supabase
    .from('students')
    .select('batch')
    .eq('coaching_center_id', coachingCenterId)
    .eq('standard', standard)

  const batchSet = new Set<string>()
  students?.forEach((s) => {
    if (s.batch) batchSet.add(s.batch)
  })
  const batches = Array.from(batchSet).sort()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Resource Management</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">Upload and manage study materials for {standard} standard students.</p>
      </div>
      <StandardTabs />
      <ResourcesClient coachingCenterId={coachingCenterId} batches={batches} standard={standard} />
    </div>
  )
}

