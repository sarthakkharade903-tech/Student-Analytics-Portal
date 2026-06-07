import { createClient } from '@/lib/supabase/server'
import { Building2, Mail, Phone, User, Shield, Calendar } from 'lucide-react'

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[var(--border)] last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[oklch(0.62_0.22_265/0.1)] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted-foreground)] mb-0.5">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          Manage your coaching institute and account details.
        </p>
      </div>

      <div className="space-y-6">
        {/* Coaching Center Card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="font-semibold">Coaching Institute</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Your institute information</p>
            </div>
          </div>
          <div className="px-6">
            <InfoRow
              icon={<Building2 className="w-4 h-4 text-[var(--primary)]" />}
              label="Institute Name"
              value={coachingCenter?.name ?? '—'}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4 text-[var(--primary)]" />}
              label="Email Address"
              value={coachingCenter?.email ?? '—'}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4 text-[var(--primary)]" />}
              label="Phone Number"
              value={coachingCenter?.phone ?? '—'}
            />
          </div>
        </div>

        {/* Account Card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="font-semibold">Account Details</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Your personal account</p>
            </div>
          </div>
          <div className="px-6">
            <InfoRow
              icon={<User className="w-4 h-4 text-[var(--primary)]" />}
              label="Owner Name"
              value={userProfile?.name ?? '—'}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4 text-[var(--primary)]" />}
              label="Email Address"
              value={userProfile?.email ?? user?.email ?? '—'}
            />
            <InfoRow
              icon={<Shield className="w-4 h-4 text-[var(--primary)]" />}
              label="Role"
              value={userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'Owner'}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4 text-[var(--primary)]" />}
              label="Member Since"
              value={joinedAt}
            />
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold mb-2">More Settings Coming Soon</h3>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            Upcoming features include custom branding, notification preferences,
            team member management, and billing settings.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Custom Branding', 'Notifications', 'Team Members', 'Billing'].map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
