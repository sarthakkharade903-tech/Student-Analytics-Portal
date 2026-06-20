import { createClient } from '@/lib/supabase/server'
import StudentTable from '@/components/dashboard/StudentTable'
import { Users } from 'lucide-react'

export const metadata = {
  title: 'Students',
  description: 'Manage your student roster.',
}

export default async function StudentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get user's coaching_center_id
  const { data: userProfile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user!.id)
    .single()

  // Fetch all students for this coaching center
  const { data: students, error } = userProfile?.coaching_center_id
    ? await supabase
        .from('students')
        .select('id, name, roll_no, batch, parent_phone, created_at')
        .eq('coaching_center_id', userProfile.coaching_center_id)
        .order('created_at', { ascending: false })
    : { data: [], error: null }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
          <Users className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Manage your coaching institute&apos;s student roster.
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 mb-6">
          Failed to load students: {error.message}
        </div>
      )}

      {/* Student Table with Search */}
      <StudentTable students={students ?? []} />
    </div>
  )
}
