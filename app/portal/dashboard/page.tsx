import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortalLogoutButton from './LogoutButton'
import {
  GraduationCap,
  Trophy,
  Percent,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  CalendarDays,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentRow {
  id: string
  name: string
  batch: string
  roll_no: string
  parent_phone: string
}

interface ScoreRow {
  id: string
  test_id: string
  total: number
  percentage: number
  rank: number | null
  is_absent: boolean
  tests: {
    id: string
    test_name: string
    test_date: string
    max_marks: number
    subjects: string[]
    target_batches: string[] | null
  } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(
  isAbsent: boolean,
  currentPct: number,
  prevPct: number | null
) {
  if (isAbsent) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/25">
        Absent
      </span>
    )
  }
  if (prevPct === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
        First Test
      </span>
    )
  }
  if (currentPct > prevPct) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
        <TrendingUp className="w-3 h-3" /> Improved
      </span>
    )
  }
  if (currentPct < prevPct) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25">
        <TrendingDown className="w-3 h-3" /> Declined
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
      <Minus className="w-3 h-3" /> Same
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PortalDashboardPage() {
  // 1. Read session cookie
  const cookieStore = await cookies()
  const studentId = cookieStore.get('portal_session')?.value

  if (!studentId) {
    redirect('/portal')
  }

  const supabase = await createClient()

  // 2. Fetch student
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, name, batch, roll_no, parent_phone')
    .eq('id', studentId)
    .single<StudentRow>()

  if (studentErr || !student) {
    redirect('/portal')
  }

  // 3. Fetch all scores for this student (joined with test info)
  const { data: rawScores } = await supabase
    .from('scores')
    .select(`
      id,
      test_id,
      total,
      percentage,
      rank,
      is_absent,
      tests (
        id,
        test_name,
        test_date,
        max_marks,
        subjects,
        target_batches
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  const scores: ScoreRow[] = (rawScores ?? []).filter((s) => s.tests !== null) as unknown as ScoreRow[]

  // 4. Sort chronologically for status calculation (oldest first)
  const chronological = [...scores].sort(
    (a, b) =>
      new Date(a.tests!.test_date).getTime() - new Date(b.tests!.test_date).getTime()
  )

  // 5. Calculate overview metrics
  const presentScores = scores.filter((s) => !s.is_absent)
  const testsGiven = presentScores.length

  // Latest test = first item in desc-sorted scores
  const latestScore = scores[0] ?? null
  const latestPct = latestScore && !latestScore.is_absent ? latestScore.percentage : null
  const latestRank = latestScore && !latestScore.is_absent ? latestScore.rank : null

  // Test Participation % — count tests targeting this student's batch
  const assignedTests = scores.filter(
    (s) =>
      !s.tests?.target_batches ||
      s.tests.target_batches.length === 0 ||
      s.tests.target_batches.some(
        (b) => b.trim().toLowerCase() === student.batch.trim().toLowerCase()
      )
  )
  const participationPct =
    assignedTests.length > 0
      ? Math.round((testsGiven / assignedTests.length) * 100)
      : testsGiven > 0
      ? 100
      : 0

  // Improvement trend (compare latest vs second latest present test)
  const presentChron = chronological.filter((s) => !s.is_absent)
  const trendDiff =
    presentChron.length >= 2
      ? presentChron[presentChron.length - 1].percentage -
        presentChron[presentChron.length - 2].percentage
      : null

  // 6. Build rows for table: newest first, attach "prev percentage" for status
  // Build a map: chronological index → prev pct
  const chronPctMap = new Map<string, number | null>()
  for (let i = 0; i < chronological.length; i++) {
    if (chronological[i].is_absent) {
      chronPctMap.set(chronological[i].id, null)
    } else {
      // find last non-absent before this
      let prev: number | null = null
      for (let j = i - 1; j >= 0; j--) {
        if (!chronological[j].is_absent) {
          prev = chronological[j].percentage
          break
        }
      }
      chronPctMap.set(chronological[i].id, prev)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-[oklch(0.62_0.22_265/0.06)] blur-3xl pointer-events-none" />

      {/* Navbar */}
      <header className="relative border-b border-[var(--border)] bg-[oklch(0.10_0.012_240/0.9)] backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] border border-[oklch(0.62_0.22_265/0.3)] flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-[var(--primary)] w-[18px] h-[18px]" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{student.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Roll No. {student.roll_no} · {student.batch}
              </p>
            </div>
          </div>
          <PortalLogoutButton />
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Overview heading */}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="gradient-text">{student.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Here&apos;s how you&apos;re performing across all tests.
          </p>
        </div>

        {/* ── Mock Test CTA ───────────────────────────────────────── */}
        <a
          href="/api/sso/student"
          className="group block rounded-2xl overflow-hidden border border-[oklch(0.62_0.22_265/0.3)] bg-gradient-to-r from-[oklch(0.62_0.22_265/0.12)] to-[oklch(0.65_0.18_300/0.08)] hover:border-[oklch(0.62_0.22_265/0.6)] transition-all duration-200 hover:shadow-lg hover:shadow-[oklch(0.62_0.22_265/0.1)]"
        >
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[oklch(0.62_0.22_265/0.2)] border border-[oklch(0.62_0.22_265/0.3)] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-base">Take an Online Mock Test</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">JEE Main · JEE Advanced · NEET · MHT-CET — NTA simulator with timer &amp; auto-grading</p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-xl group-hover:opacity-90 transition-all glow-primary whitespace-nowrap">
              Start Test
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </div>
          </div>
        </a>

        {/* ── Overview Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Latest Rank */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
                <Trophy className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Latest Rank</p>
            </div>
            <p className="text-3xl font-bold">
              {latestRank != null ? `#${latestRank}` : <span className="text-lg text-[var(--muted-foreground)]">N/A</span>}
            </p>
          </div>

          {/* Latest Percentage */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.70_0.15_180/0.15)] flex items-center justify-center">
                <Percent className="w-4 h-4 text-[oklch(0.70_0.15_180)]" />
              </div>
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Latest Score</p>
            </div>
            <p className="text-3xl font-bold">
              {latestPct != null
                ? <>{latestPct.toFixed(1)}<span className="text-lg text-[var(--muted-foreground)]">%</span></>
                : <span className="text-lg text-[var(--muted-foreground)]">N/A</span>}
            </p>
          </div>

          {/* Test Participation */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.72_0.18_90/0.15)] flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-[oklch(0.72_0.18_90)]" />
              </div>
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Test Participation</p>
            </div>
            <p className="text-3xl font-bold">
              {participationPct}<span className="text-lg text-[var(--muted-foreground)]">%</span>
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{testsGiven} of {assignedTests.length} tests</p>
          </div>

          {/* Improvement Trend */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                trendDiff === null ? 'bg-[var(--secondary)]' :
                trendDiff > 0 ? 'bg-green-500/15' : trendDiff < 0 ? 'bg-orange-500/15' : 'bg-[var(--secondary)]'
              }`}>
                {trendDiff === null ? (
                  <TrendingUp className="w-4 h-4 text-[var(--muted-foreground)]" />
                ) : trendDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : trendDiff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                ) : (
                  <Minus className="w-4 h-4 text-[var(--muted-foreground)]" />
                )}
              </div>
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Trend</p>
            </div>
            <p className={`text-3xl font-bold ${
              trendDiff === null ? 'text-[var(--muted-foreground)]' :
              trendDiff > 0 ? 'text-green-400' : trendDiff < 0 ? 'text-orange-400' : 'text-[var(--muted-foreground)]'
            }`}>
              {trendDiff === null
                ? '—'
                : trendDiff > 0
                ? `+${trendDiff.toFixed(1)}%`
                : `${trendDiff.toFixed(1)}%`}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">vs previous test</p>
          </div>
        </div>

        {/* ── Recent Tests Table ──────────────────────────────────────── */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            <div>
              <p className="font-semibold text-sm">All Tests</p>
              <p className="text-xs text-[var(--muted-foreground)]">{scores.length} test{scores.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>

          {scores.length === 0 ? (
            <div className="py-20 text-center">
              <CalendarDays className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-3 opacity-40" />
              <p className="text-[var(--muted-foreground)] text-sm">No tests recorded yet.</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 opacity-60">Check back after your first test result is uploaded.</p>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="grid grid-cols-[1fr_80px_100px_120px_110px] gap-4 px-6 py-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.5)]">
                {['Test Name', 'Date', 'Rank', 'Score', 'Status'].map((h) => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {h}
                  </span>
                ))}
              </div>

              <div className="divide-y divide-[var(--border)]">
                {scores.map((score) => {
                  const test = score.tests!
                  const prevPct = chronPctMap.get(score.id) ?? null
                  const dateStr = new Date(test.test_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })

                  return (
                    <div
                      key={score.id}
                      className={`grid grid-cols-[1fr_80px_100px_120px_110px] gap-4 px-6 py-4 items-center text-sm transition-colors hover:bg-[oklch(0.62_0.22_265/0.03)] ${
                        score.is_absent ? 'opacity-70' : ''
                      }`}
                    >
                      {/* Test Name */}
                      <div>
                        <p className="font-medium truncate">{test.test_name}</p>
                        {test.subjects?.length > 0 && (
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                            {test.subjects.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      <span className="text-xs text-[var(--muted-foreground)]">{dateStr}</span>

                      {/* Rank */}
                      <span className="font-mono text-sm font-semibold text-[var(--primary)]">
                        {score.is_absent ? '—' : score.rank != null ? `#${score.rank}` : '—'}
                      </span>

                      {/* Score */}
                      <span>
                        {score.is_absent ? (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        ) : (
                          <>
                            <span className="font-semibold">{score.total}</span>
                            <span className="text-[var(--muted-foreground)]">/{test.max_marks}</span>
                            <span className="text-xs text-[var(--muted-foreground)] ml-1.5">
                              ({score.percentage.toFixed(1)}%)
                            </span>
                          </>
                        )}
                      </span>

                      {/* Status */}
                      {statusBadge(score.is_absent, score.percentage, prevPct)}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
