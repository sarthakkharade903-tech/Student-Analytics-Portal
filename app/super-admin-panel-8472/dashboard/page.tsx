import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, CheckCircle, XCircle, AlertTriangle, Clock, Key } from 'lucide-react'
import AddCoachingModal from './AddCoachingModal'
import DeleteInstituteModal from './DeleteInstituteModal'

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboard() {
  const supabase = createAdminClient()

  // Fetch Institutes using Admin Client (bypasses RLS)
  const { data: institutesData, error: institutesError } = await supabase
    .from('coaching_centers')
    .select('*')
    .order('created_at', { ascending: false })

  if (institutesError) {
    console.error('Error fetching institutes:', institutesError)
  }

  // Fetch Access Codes separately
  const { data: codesData, error: codesError } = await supabase
    .from('institute_access_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (codesError) {
    console.error('Error fetching codes:', codesError)
  }

  const list = institutesData || []
  const codes = codesData || []

  // Create a map of coaching_center_id -> code
  const instituteCodes: Record<string, string> = {}
  codes.forEach((c: any) => {
    if (c.coaching_center_id) {
      instituteCodes[c.coaching_center_id] = c.code
    }
  })

  // Calculate metrics
  const total = list.length
  const active = list.filter((i: any) => i.account_status === 'Active' && i.is_active !== false).length
  const expired = list.filter((i: any) => i.account_status === 'Expired').length
  const suspended = list.filter((i: any) => i.account_status === 'Suspended' || i.is_active === false).length
  const trial = list.filter((i: any) => i.account_status === 'Trial' && i.is_active !== false).length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
            Dashboard
          </h1>
          <p className="text-white/40 mt-1">Manage platform access and secure deletion.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Metrics */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard title="Total Institutes" value={total} icon={Building2} color="from-blue-500 to-cyan-500" />
          <MetricCard title="Active Plans" value={active} icon={CheckCircle} color="from-emerald-400 to-green-600" />
          <MetricCard title="Trial Accounts" value={trial} icon={Clock} color="from-amber-400 to-yellow-600" />
          <MetricCard title="Expired" value={expired} icon={XCircle} color="from-orange-500 to-red-500" />
          <MetricCard title="Suspended" value={suspended} icon={AlertTriangle} color="from-rose-500 to-red-700" />
        </div>

        {/* Right Side: Add Coaching Widget */}
        <div className="lg:col-span-1">
          <div className="h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
             {/* Glow */}
             <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-red-500/20 rounded-full blur-[50px] pointer-events-none" />
             
             <div>
               <div className="flex items-center mb-4">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-3 border border-white/10">
                   <Key className="w-5 h-5 text-red-400" />
                 </div>
                 <h2 className="text-lg font-bold text-white">Provisioning</h2>
               </div>
               <p className="text-sm text-white/50 mb-6 leading-relaxed">
                 Pre-create a coaching institute and instantly generate a secure, one-time access code. Provide this code to the institute owner for registration.
               </p>
             </div>
             
             <AddCoachingModal />
          </div>
        </div>
      </div>

      {/* Institutes Table */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
          <h2 className="font-bold text-white text-lg">Registered Institutes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-widest font-semibold">
                <th className="p-5">Institute Name</th>
                <th className="p-5">Owner</th>
                <th className="p-5">Assigned Key</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-white/30">
                    No institutes registered yet. Add one above!
                  </td>
                </tr>
              ) : (
                list.map((institute: any) => {
                  const boundCode = instituteCodes[institute.id]
                  const displayName = institute.features?.superAdminData?.name || institute.name
                  const displayOwner = institute.features?.superAdminData?.owner_name || institute.owner_name

                  return (
                    <tr key={institute.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-5">
                        <div className="font-semibold text-white group-hover:text-red-400 transition-colors">
                          {displayName}
                        </div>
                        <div className="text-xs text-white/40 mt-1">{institute.city || 'Location unknown'}</div>
                      </td>
                      <td className="p-5">
                        <div className="text-white/80">{displayOwner || 'N/A'}</div>
                        <div className="text-xs text-white/40 mt-1">{institute.email}</div>
                      </td>
                      <td className="p-5">
                        {boundCode ? (
                          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-xs font-bold tracking-widest text-emerald-400 shadow-inner select-all">
                            {boundCode}
                          </div>
                        ) : (
                          <span className="text-white/20 italic text-xs">Legacy Account</span>
                        )}
                      </td>
                      <td className="p-5">
                        <StatusBadge status={institute.is_active === false ? 'Suspended' : institute.account_status || 'Trial'} />
                      </td>
                      <td className="p-5 text-right whitespace-nowrap">
                        <Link 
                          href={`/super-admin-panel-8472/dashboard/institutes/${institute.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/20"
                        >
                          Manage
                        </Link>
                        <DeleteInstituteModal instituteId={institute.id} instituteName={institute.name} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col justify-between items-start gap-4 shadow-lg hover:bg-white/5 transition-colors relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-bl-full group-hover:opacity-20 transition-opacity`} />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
        <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mt-1">{title}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-white/5 text-white/40 border-white/10'
  
  if (status === 'Active') colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'Trial') colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (status === 'Expired') colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  if (status === 'Suspended') colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20'

  return (
    <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border ${colorClass}`}>
      {status}
    </span>
  )
}
