import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/dashboard/StatCard'
import { Users, ClipboardList, MessageCircle, CalendarCheck, ArrowRight, CheckCircle } from 'lucide-react'

const gettingStartedSteps = [
  {
    step: 1,
    title: 'Add Students',
    description: 'Import your student roster by entering details or uploading a CSV file.',
    icon: Users,
    comingSoon: true,
  },
  {
    step: 2,
    title: 'Upload Test Results',
    description: 'Share test scores to automatically track performance over time.',
    icon: ClipboardList,
    comingSoon: true,
  },
  {
    step: 3,
    title: 'Invite Parents',
    description: 'Send parents a link to view their child\'s performance dashboard.',
    icon: MessageCircle,
    comingSoon: true,
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('name, role, coaching_center_id')
    .eq('id', user!.id)
    .single()

  // Fetch coaching center
  const { data: coachingCenter } = userProfile?.coaching_center_id
    ? await supabase
        .from('coaching_centers')
        .select('name')
        .eq('id', userProfile.coaching_center_id)
        .single()
    : { data: null }

  const displayName = userProfile?.name ?? user?.email ?? 'there'
  const centerName = coachingCenter?.name ?? 'your institute'

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          <span>Account active</span>
          <span className="text-[var(--border)]">·</span>
          <span>{centerName}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome back, <span className="gradient-text">{displayName.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1 text-sm">
          Here&apos;s a snapshot of your coaching institute today.
        </p>
      </div>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          title="Total Students"
          value={0}
          icon={Users}
          description="Add students to get started"
          color="purple"
        />
        <StatCard
          title="Tests Uploaded"
          value={0}
          icon={ClipboardList}
          description="No tests uploaded yet"
          color="blue"
        />
        <StatCard
          title="Active Parents"
          value={0}
          icon={MessageCircle}
          description="Invite parents to join"
          color="green"
        />
        <StatCard
          title="Attendance Rate"
          value="--"
          icon={CalendarCheck}
          description="Track attendance to see data"
          color="orange"
        />
      </section>

      {/* Welcome card */}
      <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[oklch(0.62_0.22_265/0.08)] rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="text-xl font-semibold mb-2">Welcome to Parent Analytics Portal</h2>
          <p className="text-[var(--muted-foreground)] text-sm max-w-2xl leading-relaxed">
            You&apos;re all set! Your account is created and your coaching institute is ready.
            Follow the steps below to unlock the full power of automated parent communication
            and student performance tracking.
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {gettingStartedSteps.map(({ step, title, description, icon: Icon, comingSoon }) => (
            <div
              key={step}
              className="glass-card rounded-2xl p-6 group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.12)] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <span className="text-3xl font-bold text-[oklch(0.62_0.22_265/0.12)] select-none">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {title}
                {comingSoon && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                    Soon
                  </span>
                )}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
                {description}
              </p>
              <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors">
                Coming soon
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
