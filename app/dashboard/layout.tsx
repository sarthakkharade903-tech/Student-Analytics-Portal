import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

import BackButton from '@/components/ui/BackButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute top-6 left-6 z-50 lg:hidden">
          {/* Show on mobile if sidebar is hidden, though sidebar is currently sticky */}
          <BackButton className="bg-[var(--sidebar)]/80 backdrop-blur-xl shadow-lg border-[var(--border)]" />
        </div>
        <div className="hidden lg:block absolute top-6 left-6 z-50">
           <BackButton className="bg-[var(--sidebar)]/80 backdrop-blur-xl shadow-lg border-[var(--border)] text-[var(--foreground)] hover:bg-black/5" />
        </div>
        {children}
      </main>
    </div>
  )
}
