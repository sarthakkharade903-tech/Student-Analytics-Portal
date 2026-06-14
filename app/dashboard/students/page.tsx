import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentTable from '@/components/dashboard/StudentTable'
import { Users } from 'lucide-react'

export const metadata = {
  title: 'Students – Parent Analytics Portal',
  description: 'Manage your student roster.',
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ std?: string }>
}) {
  const { std: stdParam } = await searchParams
  const standard = stdParam === '12th' ? '12th' : '11th'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's coaching_center_id
  const { data: userProfile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  let studentsData = []
  let errorMsg = null

  if (userProfile?.coaching_center_id) {
    // We infer class 11 vs 12 based on whether the batch contains "12"
    let studQuery = supabase
      .from('students')
      .select('id, name, roll_no, batch, parent_phone, created_at')
      .eq('coaching_center_id', userProfile.coaching_center_id)
      .order('created_at', { ascending: false })

    if (standard === '12th') {
      studQuery = studQuery.ilike('batch', '%12%')
    } else {
      studQuery = studQuery.not('batch', 'ilike', '%12%')
    }

    const { data: students, error } = await studQuery
    studentsData = students || []
    if (error) {
      errorMsg = error.message
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
          <Users className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Students — {standard}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {standard} standard student roster for your coaching institute.
          </p>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-6">
          Failed to load students: {errorMsg}
        </div>
      )}

      {/* Student Table with Search */}
      <StudentTable students={studentsData} standard={standard} />
    </div>
  )
}
