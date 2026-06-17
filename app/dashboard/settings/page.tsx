import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditProfileDialog } from './EditProfileDialog'
import { FeatureManagement } from './FeatureManagement'
import {
  Building2,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Bell,
  CreditCard,
  Settings2,
  Users,
  FileSpreadsheet,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Lock,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────── */
interface InfoBlockProps {
  icon: React.ReactNode
  iconBgClass: string
  label: string
  value: string
}

interface SectionCardProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBgClass: string
  children: React.ReactNode
}

interface ComingSoonCardProps {
  icon: React.ReactNode
  iconBgClass: string
  title: string
  description: string
  badge: string
}

interface StatCardProps {
  icon: React.ReactNode
  iconBgClass: string
  label: string
  value: string
}

/* ─────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────── */

function InfoBlock({ icon, iconBgClass, label, value }: InfoBlockProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 group">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${iconBgClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900 truncate">
          {value}
        </p>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, icon, iconBgClass, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-gray-100">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgClass}`}
        >
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function StatCard({ icon, iconBgClass, label, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${iconBgClass}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function ComingSoonCard({ icon, iconBgClass, title, description, badge }: ComingSoonCardProps) {
  return (
    <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 opacity-80">
      <div className="p-6 flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgClass}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 bg-white">
              {badge}
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ std?: string }>
}) {
  const { std: stdParam } = await searchParams
  const standard = stdParam === '12th' ? '12th' : '11th'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: coachingCenter } = userProfile?.coaching_center_id
    ? await supabase
        .from('coaching_centers')
        .select('*')
        .eq('id', userProfile.coaching_center_id)
        .single()
    : { data: null }

  const savedFeatures = coachingCenter?.features ?? {}

  const { count: totalStudents } = userProfile?.coaching_center_id
    ? await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('coaching_center_id', userProfile.coaching_center_id)
        .eq('standard', standard)
    : { count: 0 }

  const { count: testsUploaded } = userProfile?.coaching_center_id
    ? await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true })
        .eq('coaching_center_id', userProfile.coaching_center_id)
        .eq('standard', standard)
    : { count: 0 }

  let activeBatches = 0
  if (userProfile?.coaching_center_id) {
    const { data: students } = await supabase
      .from('students')
      .select('batch')
      .eq('coaching_center_id', userProfile.coaching_center_id)
      .eq('standard', standard)
    
    const batchSet = new Set<string>()
    students?.forEach((s) => {
      if (s.batch) batchSet.add(s.batch)
    })
    activeBatches = batchSet.size
  }

  const joinedAt = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—'

  const ownerName = userProfile?.name ?? user?.email?.split('@')[0] ?? 'Admin'
  const ownerInitials = ownerName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const role = userProfile?.role
    ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
    : 'Administrator'

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-slate-50/50">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* ══ PAGE HEADER ════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Large icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg shadow-blue-600/20">
              <Settings2 className="w-7 h-7 text-white" />
            </div>
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-2 bg-blue-50 text-blue-600 border border-blue-100">
                <Settings2 className="w-3 h-3" />
                System Settings
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Settings — {standard}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage institute information, account details and platform preferences.
              </p>
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-3 sm:flex-shrink-0">
            <EditProfileDialog 
              initialOwnerName={ownerName} 
              initialInstituteName={coachingCenter?.name ?? ''} 
            />
          </div>
        </div>

        {/* ══ QUICK STATS ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            iconBgClass="bg-blue-100"
            label="Total Students"
            value={totalStudents?.toString() || '0'}
          />
          <StatCard
            icon={<FileSpreadsheet className="w-5 h-5 text-indigo-600" />}
            iconBgClass="bg-indigo-100"
            label="Tests Uploaded"
            value={testsUploaded?.toString() || '0'}
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5 text-emerald-600" />}
            iconBgClass="bg-emerald-100"
            label="Active Batches"
            value={activeBatches.toString()}
          />
        </div>

        {/* ══ COACHING INSTITUTE CARD ════════════════════════════ */}
        <SectionCard
          title="Coaching Institute"
          subtitle="Your institute information"
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          iconBgClass="bg-blue-50 border border-blue-100"
        >
          {/* Info blocks */}
          <div className="p-6 grid gap-3 bg-gray-50/30">
            <InfoBlock
              icon={<Building2 className="w-4 h-4 text-blue-600" />}
              iconBgClass="bg-blue-50"
              label="Institute Name"
              value={coachingCenter?.name ?? '—'}
            />
            <InfoBlock
              icon={<Mail className="w-4 h-4 text-violet-600" />}
              iconBgClass="bg-violet-50"
              label="Email Address"
              value={coachingCenter?.email ?? '—'}
            />
            <InfoBlock
              icon={<Phone className="w-4 h-4 text-emerald-600" />}
              iconBgClass="bg-emerald-50"
              label="Phone Number"
              value={coachingCenter?.phone ?? '—'}
            />
          </div>
        </SectionCard>

        {/* ══ ACCOUNT DETAILS CARD ═══════════════════════════════ */}
        <SectionCard
          title="Account Details"
          subtitle="Your personal account"
          icon={<User className="w-5 h-5 text-indigo-600" />}
          iconBgClass="bg-indigo-50 border border-indigo-100"
        >
          <div className="p-6 space-y-5 bg-gray-50/30">
            {/* Profile row */}
            <div className="flex items-center gap-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {ownerInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-gray-900 text-base">
                    {ownerName}
                  </span>
                  {/* Verified badge */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {userProfile?.email ?? user?.email ?? '—'}
                </p>
              </div>
              {/* Role chip */}
              <span className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 bg-indigo-50 text-indigo-700 border border-indigo-200">
                {role}
              </span>
            </div>

            {/* Info blocks */}
            <div className="grid gap-3">
              <InfoBlock
                icon={<User className="w-4 h-4 text-indigo-600" />}
                iconBgClass="bg-indigo-50"
                label="Owner Name"
                value={ownerName}
              />
              <InfoBlock
                icon={<Mail className="w-4 h-4 text-blue-600" />}
                iconBgClass="bg-blue-50"
                label="Email Address"
                value={userProfile?.email ?? user?.email ?? '—'}
              />
              <InfoBlock
                icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
                iconBgClass="bg-emerald-50"
                label="Role"
                value={role}
              />
              <InfoBlock
                icon={<Calendar className="w-4 h-4 text-orange-600" />}
                iconBgClass="bg-orange-50"
                label="Member Since"
                value={joinedAt}
              />
            </div>
          </div>
        </SectionCard>

        {/* ══ FEATURE MANAGEMENT ═══════════════════════════════════ */}
        <FeatureManagement initialFeatures={savedFeatures} />

        {/* ══ COMING SOON SECTION ════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Coming Soon
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid gap-3">
            <ComingSoonCard
              icon={<Bell className="w-5 h-5 text-orange-600" />}
              iconBgClass="bg-orange-100"
              title="Notifications"
              description="Configure email alerts, parent notification settings, and report delivery preferences."
              badge="Coming Soon"
            />
            <ComingSoonCard
              icon={<CreditCard className="w-5 h-5 text-pink-600" />}
              iconBgClass="bg-pink-100"
              title="Subscription"
              description="Manage your plan, billing information, invoices, and upgrade options."
              badge="Coming Soon"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
