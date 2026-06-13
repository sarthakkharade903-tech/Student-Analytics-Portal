import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/dashboard/StatCard'
import { Users, ClipboardList, MessageCircle, CalendarCheck, ArrowRight, CheckCircle } from 'lucide-react'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ std?: string }>
}) {
  const { std: stdParam } = await searchParams
  const standard = stdParam === '12th' ? '12th' : '11th'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('name, role, coaching_center_id')
    .eq('id', user.id)
    .single()

  // Fetch coaching center
  const { data: coachingCenter } = userProfile?.coaching_center_id
    ? await supabase
        .from('coaching_centers')
        .select('name')
        .eq('id', userProfile.coaching_center_id)
        .single()
    : { data: null }

  // Fetch student count filtered by standard
  const { count: studentCount } = userProfile?.coaching_center_id
    ? await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('coaching_center_id', userProfile.coaching_center_id)
        .eq('standard', standard)
    : { count: 0 }

  // Fetch test count filtered by standard
  const { count: testCount } = userProfile?.coaching_center_id
    ? await supabase
        .from('tests')
        .select('id', { count: 'exact', head: true })
        .eq('coaching_center_id', userProfile.coaching_center_id)
        .eq('standard', standard)
    : { count: 0 }

  // Fetch attendance rate — get students of this standard, then their attendance
  let attendanceRate = '--'
  if (userProfile?.coaching_center_id) {
    const { data: stdStudents } = await supabase
      .from('students')
      .select('id')
      .eq('coaching_center_id', userProfile.coaching_center_id)
      .eq('standard', standard)

    const studentIds = (stdStudents ?? []).map((s: { id: string }) => s.id)

    if (studentIds.length > 0) {
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('is_present')
        .eq('coaching_center_id', userProfile.coaching_center_id)
        .in('student_id', studentIds)

      if (attendanceData && attendanceData.length > 0) {
        const presentCount = attendanceData.filter((a: { is_present: boolean }) => a.is_present).length
        attendanceRate = Math.round((presentCount / attendanceData.length) * 100) + '%'
      }
    }
  }

  const displayName = userProfile?.name ?? user?.email ?? 'there'
  const centerName = coachingCenter?.name ?? 'your institute'

  const gettingStartedSteps = [
    {
      step: 1,
      title: 'Add Students',
      description: `Add your ${standard} students manually with their roll number, batch, and parent contact.`,
      icon: Users,
      comingSoon: false,
      href: `/dashboard/students?std=${standard}`,
      actionLabel: 'Go to Students',
    },
    {
      step: 2,
      title: 'Upload Test Results',
      description: 'Create a test and upload a CSV of marks — ranks and percentages are calculated automatically.',
      icon: ClipboardList,
      comingSoon: false,
      href: `/dashboard/tests?std=${standard}`,
      actionLabel: 'Go to Tests',
    },
    {
      step: 3,
      title: 'Invite Parents',
      description: "Send parents a link to view their child's performance dashboard.",
      icon: MessageCircle,
      comingSoon: true,
      href: '#',
      actionLabel: 'Coming soon',
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          <span>Account active</span>
          <span className="text-[var(--border)]">·</span>
          <span>{centerName}</span>
          <span className="text-[var(--border)]">·</span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold border border-[var(--primary)]/20">
            {standard} Std
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome back, <span className="gradient-text">{displayName.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-[var(--muted-foreground)] mt-1 text-sm">
          Here&apos;s a snapshot of your <strong>{standard} standard</strong> students today.
        </p>
      </div>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          title="Total Students"
          value={studentCount ?? 0}
          icon={Users}
          description={studentCount ? `${standard} students enrolled` : 'Add students to get started'}
          color="purple"
        />
        <StatCard
          title="Tests Uploaded"
          value={testCount ?? 0}
          icon={ClipboardList}
          description={testCount ? `${standard} tests created` : 'Create your first test'}
          color="blue"
        />
        <StatCard
          title="Active Parents"
          value="--"
          icon={MessageCircle}
          description="Coming soon"
          color="green"
        />
        <StatCard
          title="Attendance Rate"
          value={attendanceRate}
          icon={CalendarCheck}
          description={`Average across ${standard} batches`}
          color="orange"
        />
      </section>

      {/* Welcome card */}
      <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[oklch(0.62_0.22_265/0.08)] rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="text-xl font-semibold mb-2">Coaching Analytics Portal — {standard} Standard</h2>
          <p className="text-[var(--muted-foreground)] text-sm max-w-2xl leading-relaxed">
            You are currently viewing <strong>{standard} standard</strong> data. Use the class switcher in the sidebar to switch between 11th and 12th standard students, tests, and attendance independently.
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {gettingStartedSteps.map(({ step, title, description, icon: Icon, comingSoon, href, actionLabel }) => (
            <div
              key={step}
              className="glass-card rounded-2xl p-6 group relative overflow-hidden hover:border-[oklch(0.62_0.22_265/0.4)] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.12)] flex items-center justify-center group-hover:bg-[oklch(0.62_0.22_265/0.22)] transition-colors">
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
              {comingSoon ? (
                <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  {actionLabel}
                  <ArrowRight className="w-3 h-3" />
                </div>
              ) : (
                <Link
                  href={href}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline group-hover:gap-2 transition-all"
                >
                  {actionLabel}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
