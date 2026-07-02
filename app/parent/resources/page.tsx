import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { createServerClient } from '@supabase/ssr'
import StudentResourcesClient from './StudentResourcesClient'

export default async function StudentResourcesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value

  if (!token) {
    redirect('/parent/login')
  }

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

  if (!student) {
    const BlockedAccess = (await import('@/components/ui/BlockedAccess')).default
    return <BlockedAccess message="Your student profile has been deleted or is no longer accessible." showLogout={true} />
  }

  // Fetch Initial Resources (Limit 50)
  const { data: initialResources } = await supabase
    .from('resources')
    .select('*')
    .eq('coaching_center_id', student.coaching_center_id)
    .eq('standard', student.standard)
    .or(`target_batches.cs.{"${student.batch}"},target_batches.cs.{"All Batches"}`)
    .order('subject', { ascending: true })
    .order('chapter_name', { ascending: true })
    .order('is_featured', { ascending: false })
    .order('is_important', { ascending: false })
    .order('created_at', { ascending: false })
    .range(0, 49)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Learning Hub</h1>
        <p className="text-slate-400 text-sm mt-1">Access all your study materials, assignments, and mock tests here.</p>
      </div>
      <StudentResourcesClient 
        studentId={student.id} 
        coachingCenterId={student.coaching_center_id} 
        studentBatch={student.batch}
        studentStandard={student.standard}
        initialResources={initialResources || []}
      />
    </div>
  )
}
