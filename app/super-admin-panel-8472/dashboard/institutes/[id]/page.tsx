import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, ShieldAlert } from 'lucide-react'
import ActivationToggle from './ActivationToggle'
import EditInstituteForm from './EditInstituteForm'

export default async function InstituteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id } = await params

  const { data: institute, error } = await supabase
    .from('coaching_centers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !institute) {
    notFound()
  }

  // Calculate days remaining
  let daysRemaining = 0
  if (institute.end_date) {
    const end = new Date(institute.end_date).getTime()
    const now = new Date().getTime()
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
  }

  const displayName = institute.features?.superAdminData?.name || institute.name

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <Link href="/super-admin-panel-8472/dashboard" className="inline-flex items-center text-sm font-medium text-white/40 hover:text-white transition-colors mb-4 group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
            Manage Institute
          </h1>
          <p className="text-white/40 mt-1">Configure details, access control, and subscription settings for {displayName}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Left/Main Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />
            <h2 className="text-xl font-bold text-white flex items-center mb-6 pb-6 border-b border-white/10">
              <Building2 className="w-6 h-6 mr-3 text-red-400" />
              Institute Profile
            </h2>
            <EditInstituteForm institute={institute} />
          </div>
        </div>

        {/* Right Column: Status & Security */}
        <div className="space-y-6">
          
          {/* Subscription Status Card */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
             <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-10 pointer-events-none ${daysRemaining > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
             <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Subscription</h3>
             <div className="text-4xl font-black text-white tracking-tighter mb-1">
               {daysRemaining > 0 ? `${daysRemaining}` : '0'}
             </div>
             <div className="text-sm text-white/40 font-medium">{daysRemaining > 0 ? 'Days Remaining' : 'Expired'}</div>
             
             <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">Current Plan</span>
                  <span className="text-white font-bold">{institute.plan_type || 'Unknown'}</span>
                </div>
             </div>
          </div>

          {/* Security & Controls Card */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center mb-6 pb-4 border-b border-white/10">
              <ShieldAlert className="w-5 h-5 mr-3 text-red-400" />
              Access Control
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-6">
              Toggle this to instantly grant or revoke all access to the platform for this institute's admins, parents, and students.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-white mb-0.5">System Access</div>
                <div className="text-xs text-white/40">{institute.is_active !== false ? 'Currently Enabled' : 'Currently Suspended'}</div>
              </div>
              <ActivationToggle initialStatus={institute.is_active ?? true} instituteId={institute.id} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
