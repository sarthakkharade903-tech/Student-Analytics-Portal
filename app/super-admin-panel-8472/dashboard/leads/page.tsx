import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Phone, Building2, User, MapPin, Users, Calendar, CheckCircle, Clock, Mail } from 'lucide-react'
import LeadActions from './LeadActions'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const supabase = createAdminClient()

  const { data: leads, error } = await supabase
    .from('demo_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
  }

  const list = leads || []
  const total = list.length
  const pending = list.filter((l: any) => l.status === 'Pending').length
  const converted = list.filter((l: any) => l.status === 'Converted').length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin-panel-8472/dashboard"
          className="p-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
            Lead Notifications
          </h1>
          <p className="text-white/40 mt-1">Manage demo requests from coaching institutes.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{total}</div>
            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">Total Leads</div>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{pending}</div>
            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">Pending</div>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{converted}</div>
            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">Converted</div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
          <h2 className="font-bold text-white text-lg">All Demo Requests</h2>
        </div>

        {list.length === 0 ? (
          <div className="p-16 text-center text-white/30">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No demo requests yet.</p>
            <p className="text-sm mt-1">Once institutes request a demo, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-white/40 text-xs uppercase tracking-widest font-semibold">
                  <th className="p-5">Institute</th>
                  <th className="p-5">Owner</th>
                  <th className="p-5">Contact</th>
                  <th className="p-5">Location</th>
                  <th className="p-5">Students</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {list.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-red-400 transition-colors">{lead.institute_name}</div>
                          {lead.remarks && (
                            <div className="text-xs text-white/40 mt-0.5 max-w-[180px] truncate">{lead.remarks}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-white/80">
                        <User className="w-3.5 h-3.5 text-white/30 shrink-0" />
                        {lead.owner_name}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        <a
                          href={`tel:${lead.mobile_number}`}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-mono text-xs"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {lead.mobile_number}
                        </a>
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs"
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {lead.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-white/60">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-white/30" />
                        {lead.location}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-white/80">
                        <Users className="w-3.5 h-3.5 shrink-0 text-white/30" />
                        {lead.student_count}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-white/50">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-white/30" />
                        {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-5">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="p-5 text-right">
                      <LeadActions lead={lead} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function LeadStatusBadge({ status }: { status: string }) {
  let colorClass = 'bg-white/5 text-white/40 border-white/10'
  if (status === 'Pending') colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (status === 'Converted') colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (status === 'Rejected') colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20'

  return (
    <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold border ${colorClass}`}>
      {status}
    </span>
  )
}
