import { ReactNode } from 'react'
import ParentNav from './ParentNav'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value
  let studentId = null

  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
      )
      const { payload } = await jwtVerify(token, secret)
      studentId = payload.student_id as string
    } catch (e) {
      console.error('Invalid parent token', e)
    }
  }

  let isBlocked = false
  let logoUrl: string | null = null
  if (studentId) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data: student } = await supabase
      .from('students')
      .select('coaching_center_id')
      .eq('id', studentId)
      .single()

      if (student?.coaching_center_id) {
        const { data: center } = await supabase
          .from('coaching_centers')
          .select('is_active, account_status, end_date, logo_url')
          .eq('id', student.coaching_center_id)
          .single()

      if (center) {
        logoUrl = center.logo_url
        const isExpired = center.end_date ? new Date(center.end_date) < new Date() : false
        if (center.is_active === false || center.account_status === 'Suspended' || center.account_status === 'Expired' || isExpired) {
          isBlocked = true
        }
      }
    }
  }

  if (isBlocked) {
    const BlockedAccess = (await import('@/components/ui/BlockedAccess')).default
    return <BlockedAccess message="Your institute's platform access has been suspended or the subscription has expired." />
  }

  return (
    <div className="min-h-screen bg-[#0f1729] text-slate-100 font-sans selection:bg-blue-500/30">
      <ParentNav studentId={studentId} logoUrl={logoUrl} />
      <main className="max-w-5xl mx-auto px-4 py-8 lg:px-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
