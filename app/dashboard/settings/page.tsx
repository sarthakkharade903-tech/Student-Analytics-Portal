import { createClient } from '@/lib/supabase/server'
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
  iconBg: string
  label: string
  value: string
}

interface SectionCardProps {
  accentColor: string
  children: React.ReactNode
}

interface ComingSoonCardProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  badge: string
  accentColor: string
}

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  gradient: string
}

/* ─────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────── */

function InfoBlock({ icon, iconBg, label, value }: InfoBlockProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[oklch(0.14_0.012_240)] border border-[oklch(0.22_0.015_240)] hover:border-[oklch(0.32_0.02_240)] transition-all duration-200 group">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[oklch(0.50_0.012_240)] mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-[oklch(0.92_0.005_240)] truncate">
          {value}
        </p>
      </div>
    </div>
  )
}

function SectionCard({ accentColor, children }: SectionCardProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[oklch(0.20_0.015_240)] shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
      style={{
        background: 'oklch(0.11 0.012 240 / 0.95)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Gradient top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: accentColor }}
      />
      {children}
    </div>
  )
}

function StatCard({ icon, iconBg, label, value, gradient }: StatCardProps) {
  return (
    <div
      className="relative rounded-2xl p-5 border border-[oklch(0.22_0.015_240)] overflow-hidden group cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ background: gradient }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-[oklch(0.96_0.005_240)] mb-1">{value}</div>
      <div className="text-xs font-medium text-[oklch(0.55_0.012_240)] uppercase tracking-wider">{label}</div>
    </div>
  )
}

function ComingSoonCard({ icon, iconBg, title, description, badge, accentColor }: ComingSoonCardProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-[oklch(0.20_0.015_240)] opacity-60"
      style={{ background: 'oklch(0.10 0.010 240 / 0.8)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accentColor }} />
      <div className="p-6 flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-[oklch(0.75_0.008_240)]">{title}</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-[oklch(0.28_0.015_240)] text-[oklch(0.50_0.012_240)] bg-[oklch(0.16_0.012_240)]">
              {badge}
            </span>
          </div>
          <p className="text-xs text-[oklch(0.45_0.010_240)] leading-relaxed">{description}</p>
        </div>
        <Lock className="w-4 h-4 text-[oklch(0.35_0.010_240)] flex-shrink-0 mt-0.5" />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: coachingCenter } = userProfile?.coaching_center_id
    ? await supabase
        .from('coaching_centers')
        .select('*')
        .eq('id', userProfile.coaching_center_id)
        .single()
    : { data: null }

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
    <div className="relative min-h-screen p-6 lg:p-8 overflow-hidden">

      {/* ── Decorative background glows ── */}
      <div
        className="pointer-events-none absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, oklch(0.62 0.22 265), transparent 70%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-[-60px] w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 300), transparent 70%)' }}
        aria-hidden
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            'linear-gradient(oklch(0.60 0.02 240) 1px, transparent 1px), linear-gradient(90deg, oklch(0.60 0.02 240) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden
      />

      <div className="relative max-w-4xl mx-auto space-y-8">

        {/* ══ PAGE HEADER ════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Large icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, oklch(0.55 0.22 265 / 0.25), oklch(0.55 0.22 265 / 0.08))',
                border: '1px solid oklch(0.62 0.22 265 / 0.3)',
              }}
            >
              <Settings2 className="w-7 h-7" style={{ color: 'oklch(0.72 0.20 265)' }} />
            </div>
            <div>
              {/* Gradient badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-2"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.62 0.22 265 / 0.2), oklch(0.62 0.22 300 / 0.1))',
                  border: '1px solid oklch(0.62 0.22 265 / 0.3)',
                  color: 'oklch(0.75 0.18 265)',
                }}
              >
                <Settings2 className="w-3 h-3" />
                System Settings
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[oklch(0.96_0.005_240)]">
                Settings
              </h1>
              <p className="text-sm text-[oklch(0.55_0.012_240)] mt-1">
                Manage institute information, account details and platform preferences.
              </p>
            </div>
          </div>

          {/* Header action buttons */}
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: 'oklch(0.16 0.015 240)',
                border: '1px solid oklch(0.26 0.015 240)',
                color: 'oklch(0.78 0.010 240)',
              }}
            >
              Edit Profile
            </button>
            <button
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl text-white"
              style={{
                background: 'linear-gradient(135deg, oklch(0.55 0.22 265), oklch(0.52 0.22 285))',
                boxShadow: '0 2px 12px oklch(0.55 0.22 265 / 0.35)',
              }}
            >
              Update Institute
            </button>
          </div>
        </div>

        {/* ══ QUICK STATS ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-400" />}
            iconBg="oklch(0.35 0.18 240 / 0.35)"
            label="Total Students"
            value="—"
            gradient="linear-gradient(135deg, oklch(0.14 0.02 240), oklch(0.12 0.015 250))"
          />
          <StatCard
            icon={<FileSpreadsheet className="w-5 h-5 text-violet-400" />}
            iconBg="oklch(0.35 0.20 285 / 0.35)"
            label="Tests Uploaded"
            value="—"
            gradient="linear-gradient(135deg, oklch(0.13 0.02 275), oklch(0.11 0.015 265))"
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5 text-emerald-400" />}
            iconBg="oklch(0.35 0.18 160 / 0.35)"
            label="Active Batches"
            value="—"
            gradient="linear-gradient(135deg, oklch(0.14 0.02 165), oklch(0.11 0.015 155))"
          />
        </div>

        {/* ══ COACHING INSTITUTE CARD ════════════════════════════ */}
        <SectionCard accentColor="linear-gradient(90deg, oklch(0.55 0.22 240), oklch(0.60 0.18 220))">
          {/* Card header */}
          <div className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-[oklch(0.18_0.012_240)]">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'oklch(0.55 0.22 240 / 0.18)', border: '1px solid oklch(0.55 0.22 240 / 0.3)' }}
            >
              <Building2 className="w-5 h-5" style={{ color: 'oklch(0.68 0.20 240)' }} />
            </div>
            <div>
              <h2 className="font-bold text-[oklch(0.92_0.005_240)]">Coaching Institute</h2>
              <p className="text-xs text-[oklch(0.50_0.010_240)]">Your institute information</p>
            </div>
          </div>

          {/* Info blocks */}
          <div className="p-6 grid gap-3">
            <InfoBlock
              icon={<Building2 className="w-4 h-4" style={{ color: 'oklch(0.68 0.20 240)' }} />}
              iconBg="oklch(0.55 0.22 240 / 0.18)"
              label="Institute Name"
              value={coachingCenter?.name ?? '—'}
            />
            <InfoBlock
              icon={<Mail className="w-4 h-4" style={{ color: 'oklch(0.68 0.18 300)' }} />}
              iconBg="oklch(0.55 0.22 300 / 0.18)"
              label="Email Address"
              value={coachingCenter?.email ?? '—'}
            />
            <InfoBlock
              icon={<Phone className="w-4 h-4" style={{ color: 'oklch(0.68 0.18 160)' }} />}
              iconBg="oklch(0.50 0.18 160 / 0.18)"
              label="Phone Number"
              value={coachingCenter?.phone ?? '—'}
            />
          </div>
        </SectionCard>

        {/* ══ ACCOUNT DETAILS CARD ═══════════════════════════════ */}
        <SectionCard accentColor="linear-gradient(90deg, oklch(0.55 0.22 300), oklch(0.60 0.20 285))">
          {/* Card header */}
          <div className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-[oklch(0.18_0.012_240)]">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'oklch(0.55 0.22 300 / 0.18)', border: '1px solid oklch(0.55 0.22 300 / 0.3)' }}
            >
              <User className="w-5 h-5" style={{ color: 'oklch(0.70 0.20 300)' }} />
            </div>
            <div>
              <h2 className="font-bold text-[oklch(0.92_0.005_240)]">Account Details</h2>
              <p className="text-xs text-[oklch(0.50_0.010_240)]">Your personal account</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Premium avatar profile row */}
            <div
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{
                background: 'oklch(0.14 0.012 240)',
                borderColor: 'oklch(0.55 0.22 300 / 0.2)',
              }}
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black flex-shrink-0 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.55 0.22 300), oklch(0.52 0.22 285))',
                  color: '#fff',
                }}
              >
                {ownerInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-bold text-[oklch(0.95_0.005_240)] text-base">
                    {ownerName}
                  </span>
                  {/* Verified badge */}
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'oklch(0.50 0.18 160 / 0.2)',
                      color: 'oklch(0.68 0.18 160)',
                      border: '1px solid oklch(0.50 0.18 160 / 0.4)',
                    }}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[oklch(0.50_0.010_240)] truncate">
                  {userProfile?.email ?? user?.email ?? '—'}
                </p>
              </div>
              {/* Role chip */}
              <span
                className="text-xs font-bold px-3 py-1 rounded-full flex-shrink-0"
                style={{
                  background: 'oklch(0.55 0.22 300 / 0.18)',
                  color: 'oklch(0.72 0.20 300)',
                  border: '1px solid oklch(0.55 0.22 300 / 0.30)',
                }}
              >
                {role}
              </span>
            </div>

            {/* Info blocks */}
            <div className="grid gap-3">
              <InfoBlock
                icon={<User className="w-4 h-4" style={{ color: 'oklch(0.70 0.20 300)' }} />}
                iconBg="oklch(0.55 0.22 300 / 0.18)"
                label="Owner Name"
                value={ownerName}
              />
              <InfoBlock
                icon={<Mail className="w-4 h-4" style={{ color: 'oklch(0.68 0.18 240)' }} />}
                iconBg="oklch(0.55 0.22 240 / 0.18)"
                label="Email Address"
                value={userProfile?.email ?? user?.email ?? '—'}
              />
              <InfoBlock
                icon={<ShieldCheck className="w-4 h-4" style={{ color: 'oklch(0.68 0.18 160)' }} />}
                iconBg="oklch(0.50 0.18 160 / 0.18)"
                label="Role"
                value={role}
              />
              <InfoBlock
                icon={<Calendar className="w-4 h-4" style={{ color: 'oklch(0.68 0.18 50)' }} />}
                iconBg="oklch(0.50 0.20 50 / 0.18)"
                label="Member Since"
                value={joinedAt}
              />
            </div>
          </div>
        </SectionCard>

        {/* ══ COMING SOON SECTION ════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[oklch(0.42_0.010_240)]">
              Coming Soon
            </h3>
            <div className="flex-1 h-px bg-[oklch(0.20_0.012_240)]" />
          </div>
          <div className="grid gap-3">
            <ComingSoonCard
              icon={<ShieldCheck className="w-5 h-5" style={{ color: 'oklch(0.68 0.18 160)' }} />}
              iconBg="oklch(0.50 0.18 160 / 0.18)"
              title="Security &amp; Access"
              description="Two-factor authentication, password management, and active session controls."
              badge="Coming Soon"
              accentColor="linear-gradient(90deg, oklch(0.50 0.18 160), oklch(0.55 0.15 140))"
            />
            <ComingSoonCard
              icon={<Bell className="w-5 h-5" style={{ color: 'oklch(0.70 0.20 60)' }} />}
              iconBg="oklch(0.50 0.20 60 / 0.18)"
              title="Notifications"
              description="Configure email alerts, parent notification settings, and report delivery preferences."
              badge="Coming Soon"
              accentColor="linear-gradient(90deg, oklch(0.60 0.20 60), oklch(0.62 0.18 40))"
            />
            <ComingSoonCard
              icon={<CreditCard className="w-5 h-5" style={{ color: 'oklch(0.70 0.20 340)' }} />}
              iconBg="oklch(0.50 0.20 340 / 0.18)"
              title="Subscription"
              description="Manage your plan, billing information, invoices, and upgrade options."
              badge="Coming Soon"
              accentColor="linear-gradient(90deg, oklch(0.55 0.22 340), oklch(0.58 0.20 320))"
            />
          </div>
        </div>

      </div>
    </div>
  )
}
