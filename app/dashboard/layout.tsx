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

  // Subscription Stopper Logic
  const { data: profile } = await supabase
    .from('users')
    .select('coaching_center_id')
    .eq('id', user.id)
    .single()

  let isBlocked = false
  let features = null
  let daysRemaining = 100 // default safe

  if (profile?.coaching_center_id) {
    const { data: center } = await supabase
      .from('coaching_centers')
      .select('is_active, account_status, end_date, features')
      .eq('id', profile.coaching_center_id)
      .single()

    if (center) {
      features = center.features
      const endDate = center.end_date ? new Date(center.end_date) : null
      const isExpired = endDate ? endDate < new Date() : false
      
      if (endDate) {
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      if (center.is_active === false || center.account_status === 'Suspended' || center.account_status === 'Expired' || isExpired) {
        isBlocked = true
      }
    }
  }

if (isBlocked) {
  // Import dynamically or simply use a generic return to prevent child rendering
  const BlockedAccess = (await import('@/components/ui/BlockedAccess')).default
  return <BlockedAccess message="Your institute's platform access has been suspended or the subscription has expired." />
}

const ExpirationBanner = (await import('@/components/ui/ExpirationBanner')).default

return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar features={features} />
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <ExpirationBanner daysRemaining={daysRemaining} />
        <div className="absolute top-6 left-6 z-50 lg:hidden mt-12">
          {/* Show on mobile if sidebar is hidden, though sidebar is currently sticky */}
          <BackButton className="bg-[var(--sidebar)]/80 backdrop-blur-xl shadow-lg border-[var(--border)]" />
        </div>
        <div className="hidden lg:block absolute top-6 left-6 z-50 mt-12">
           <BackButton className="bg-[var(--sidebar)]/80 backdrop-blur-xl shadow-lg border-[var(--border)] text-[var(--foreground)] hover:bg-black/5" />
        </div>
        <div className="flex-1 relative">
          {children}
        </div>
      </main>
    </div>
  )
}
