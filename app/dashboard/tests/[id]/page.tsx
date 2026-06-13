import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Upload,
  Trophy,
  Users,
  TrendingUp,
  Calendar,
  ClipboardList,
} from 'lucide-react'
import AddScoreForm from '@/components/dashboard/AddScoreForm'
import BatchGrader from '@/components/dashboard/BatchGrader'
import TestResultsTable from '@/components/dashboard/TestResultsTable'
import type { ScoreRecord } from '@/components/dashboard/TestResultsTable'
import DeleteTestButton from '@/components/dashboard/DeleteTestButton'
import { normaliseSubjects } from '@/lib/subjects'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function PercentageBadge({ pct }: { pct: number }) {
  const color =
    pct >= 75
      ? 'text-green-400 bg-green-500/10 border-green-500/20'
      : pct >= 50
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      : 'text-red-400 bg-red-500/10 border-red-500/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-semibold ${color}`}>
      {pct.toFixed(1)}%
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/15 text-yellow-400 text-sm font-bold border border-yellow-500/30">
        🥇
      </span>
    )
  if (rank === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/10 text-slate-300 text-sm font-bold border border-slate-400/20">
        🥈
      </span>
    )
  if (rank === 3)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/10 text-orange-400 text-sm font-bold border border-orange-500/20">
        🥉
      </span>
    )
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] text-xs font-semibold">
      {rank}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface ScoreRow {
  id: string
  rank: number
  total: number
  percentage: number
  subject_scores: Record<string, number>
  is_absent: boolean
  student: {
    id: string
    name: string
    roll_no: string
  } | { id: string; name: string; roll_no: string }[] | null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: test } = await supabase
    .from('tests')
    .select('test_name')
    .eq('id', id)
    .single()
  return {
    title: test?.test_name
      ? `${test.test_name} – Parent Analytics Portal`
      : 'Test Details – Parent Analytics Portal',
  }
}

export default async function TestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Auth + coaching_center_id
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userProfile } = user
    ? await supabase
        .from('users')
        .select('coaching_center_id')
        .eq('id', user.id)
        .single()
    : { data: null }
  const coachingCenterId: string = userProfile?.coaching_center_id ?? ''

  // Fetch test
  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('id', id)
    .single()

  if (!test) notFound()

  // Normalise subjects (handles legacy string[] and new SubjectConfig[])
  const subjects = normaliseSubjects(test.subjects)

  // Fetch scores joined with students
  const { data: rawScores } = await supabase
    .from('scores')
    .select('id, rank, total, percentage, subject_scores, is_absent, student:students(id, name, roll_no)')
    .eq('test_id', id)
    .order('rank', { ascending: true })

  const scores = (rawScores ?? []) as ScoreRow[]

  type NormalisedScore = Omit<ScoreRow, 'student'> & {
    student: { id: string; name: string; roll_no: string } | null
  }
  const normalisedScores: NormalisedScore[] = scores.map((s) => ({
    ...s,
    student: Array.isArray(s.student) ? (s.student[0] ?? null) : s.student,
  }))

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Back link */}
      <Link
        href={`/dashboard/tests?std=${test.standard || '11th'}`}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tests
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <ClipboardList className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{test.test_name}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)]">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(test.test_date)}
              </span>
              <span className="text-[var(--border)]">·</span>
              <span className="text-sm text-[var(--muted-foreground)]">
                Max Marks: <span className="text-[var(--foreground)] font-medium">{test.max_marks}</span>
              </span>
              <span className="text-[var(--border)]">·</span>
              <span className="text-sm text-[var(--muted-foreground)]">
                Standard: <span className="text-[var(--foreground)] font-medium">{test.standard || '11th'}</span>
              </span>
            </div>

            {/* Subject pills — now show name + marks */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {subjects.map((s) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[oklch(0.62_0.22_265/0.12)] text-[var(--primary)] text-xs font-medium capitalize"
                >
                  {s.name}
                  {s.max_marks > 0 && (
                    <span className="text-[var(--primary)] opacity-60 font-normal">
                      · {s.max_marks}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <DeleteTestButton testId={id} testName={test.test_name} />
          <Link
            id="upload-results-btn"
            href={`/dashboard/tests/${id}/upload?std=${test.standard || '11th'}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all glow-primary flex-shrink-0"
          >
            <Upload className="w-4 h-4" />
            Upload Results
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card rounded-2xl p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Users className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">Appeared</span>
          </div>
          <p className="text-3xl font-bold">{test.students_appeared ?? '—'}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Trophy className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">Highest</span>
          </div>
          <p className="text-3xl font-bold">
            {test.highest_score != null ? test.highest_score : '—'}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">Average</span>
          </div>
          <p className="text-3xl font-bold">
            {test.average_score != null ? Number(test.average_score).toFixed(1) : '—'}
          </p>
        </div>
      </div>

      {/* Results table */}
      <TestResultsTable
        testId={id}
        maxMarks={test.max_marks}
        subjects={subjects}
        initialScores={normalisedScores as ScoreRecord[]}
        uploadHref={`/dashboard/tests/${id}/upload?std=${test.standard || '11th'}`}
      />

      {/* Entry methods */}
      {coachingCenterId && (
        <div className="space-y-4">
          <BatchGrader
            testId={id}
            subjects={subjects}
            maxMarks={test.max_marks}
            targetBatches={test.target_batches ?? []}
            coachingCenterId={coachingCenterId}
            standard={test.standard}
          />
          <AddScoreForm
            testId={id}
            subjects={subjects}
            maxMarks={test.max_marks}
            coachingCenterId={coachingCenterId}
          />
        </div>
      )}
    </div>
  )
}
