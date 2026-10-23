import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { createServerClient } from '@supabase/ssr'
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  Calendar, Award, Target, BookOpen, Activity,
  Building2
} from 'lucide-react'
import PerformanceChart from './PerformanceChart'
import AttendanceCalendar from './AttendanceCalendar'
import RecentTestsTable from './RecentTestsTable'
import PerformanceSummary from './PerformanceSummary'
import SubjectPerformance from './SubjectPerformance'
import { normaliseSubjects } from '@/lib/subjects'

export default async function ParentDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('parent_token')?.value

  if (!token) {
    redirect('/parent/login')
  }

  let studentId = ''
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
    )
    const { payload } = await jwtVerify(token, secret)
    studentId = payload.student_id as string
  } catch {
    redirect('/parent/login')
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Fetch Student
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (!student) {
    const BlockedAccess = (await import('@/components/ui/BlockedAccess')).default
    return <BlockedAccess message="Your student profile has been deleted or is no longer accessible." showLogout={true} />
  }

  // Fetch Coaching Center Name
  let instituteName = 'StudentIQ Coaching'
  if (student.coaching_center_id) {
    const { data: center } = await supabase
      .from('coaching_centers')
      .select('name')
      .eq('id', student.coaching_center_id)
      .single()
    if (center?.name) instituteName = center.name
  }

  // Fetch all scores for this student (joining tests to get subjects/dates)
  const { data: scores } = await supabase
    .from('scores')
    .select(`
      *,
      tests (
        id, test_name, test_date, test_type, max_marks, subjects
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })

  const validScores = scores || []
  
  // Sort by date (oldest to newest)
  validScores.sort((a, b) => {
    const dateA = new Date(a.tests?.test_date || a.created_at).getTime()
    const dateB = new Date(b.tests?.test_date || b.created_at).getTime()
    return dateA - dateB
  })

  // Daily Attendance records
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('date, is_present')
    .eq('student_id', studentId)
    .order('date', { ascending: true })

  const attendanceRecords = attendanceData || []
  const totalDays = attendanceRecords.length
  const presentDays = attendanceRecords.filter(r => r.is_present).length
  const dailyAttendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

  // Today's Attendance status calculation
  const todayStr = new Date().toISOString().split('T')[0]
  const todayRecord = attendanceRecords.find(r => r.date === todayStr)
  let todayStatusLabel = 'Awaiting Class'
  let todayBadgeClass = 'bg-[#090d16] text-slate-400 border-slate-800'
  let todayDotClass = 'bg-slate-500'

  if (todayRecord) {
    if (todayRecord.is_present) {
      todayStatusLabel = 'Marked Present Today'
      todayBadgeClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      todayDotClass = 'bg-emerald-400 animate-pulse'
    } else {
      todayStatusLabel = 'Marked Absent Today'
      todayBadgeClass = 'bg-rose-500/10 text-rose-300 border-rose-500/30'
      todayDotClass = 'bg-rose-400'
    }
  }

  let attStatus = 'No Data'
  if (totalDays > 0) {
    if (dailyAttendancePercentage >= 75) {
      attStatus = dailyAttendancePercentage >= 90 ? 'Excellent Attendance' : 'Good Standing'
    } else if (dailyAttendancePercentage >= 50) {
      attStatus = 'Needs Attention'
    } else {
      attStatus = 'Critical Attendance'
    }
  }

  // Latest test logic
  const latestScore = validScores[validScores.length - 1]
  const previousScore = validScores.length > 1 ? validScores[validScores.length - 2] : null

  // Percentile logic
  let allTestScores: any[] = []
  const testIds = validScores.map((s: any) => s.test_id)
  if (testIds.length > 0) {
    const { data } = await supabase
      .from('scores')
      .select('test_id, total, subject_scores, is_absent')
      .in('test_id', testIds)
      .eq('is_absent', false)
    
    allTestScores = data || []
  }

  const getTestScores = (testId: string) => allTestScores.filter(s => s.test_id === testId).map(s => s.total)
  const latestTestScores = allTestScores.filter(s => s.test_id === latestScore?.test_id)

  function calculatePercentile(score: number, allScores: number[]) {
    if (allScores.length === 0) return 0
    const equalOrLess = allScores.filter(s => s <= score).length
    const perc = (equalOrLess / allScores.length) * 100
    return Number.isInteger(perc) ? perc.toString() : perc.toFixed(1)
  }

  const totalScores = latestTestScores.map(s => s.total)
  const totalPercentile = latestScore && !latestScore.is_absent 
    ? calculatePercentile(latestScore.total, totalScores) 
    : 0

  // Map and enhance scores for RecentTestsTable
  const enhancedScores = [...validScores].reverse().map((score) => {
    const testSubjects = score.tests?.subjects
      ? normaliseSubjects(score.tests.subjects)
      : []

    const subjects = testSubjects.map((sub) => {
      const subScore = score.subject_scores?.[sub.name] ?? 0
      const subMax = sub.max_marks > 0 ? sub.max_marks : (score.tests?.max_marks ? (score.tests.max_marks / testSubjects.length) : 0)
      const percentage = subMax > 0 ? Math.min(100, Math.round((subScore / subMax) * 100)) : 0
      
      const testScoresForThisTest = allTestScores.filter(s => s.test_id === score.test_id)
      const subScores = testScoresForThisTest.map(s => s.subject_scores?.[sub.name] ?? 0)
      const percentile = calculatePercentile(subScore, subScores)

      const barColor =
        percentage >= 60
          ? 'from-emerald-500 to-green-500'
          : percentage >= 40
          ? 'from-amber-500 to-yellow-500'
          : 'from-rose-500 to-red-500'

      return {
        name: sub.name,
        score: subScore,
        max_marks: subMax,
        percentage,
        percentile,
        barColor
      }
    })

    return {
      id: score.id,
      test_name: score.tests?.test_name || 'Test',
      test_type: score.tests?.test_type || 'Test',
      test_date: score.tests?.test_date || score.created_at || '',
      total: score.total || 0,
      max_marks: score.tests?.max_marks || 0,
      is_absent: score.is_absent || false,
      rank: score.rank,
      total_percentile: score.is_absent ? 0 : calculatePercentile(score.total, getTestScores(score.test_id)),
      subjects
    }
  })

  // Performance Status Engine
  let status = 'No Data'
  let statusColor = 'text-gray-400'
  let StatusIcon = AlertCircle

  if (latestScore) {
    if (latestScore.is_absent) {
      status = 'Absent'
      statusColor = 'text-gray-500'
      StatusIcon = AlertCircle
    } else if (dailyAttendancePercentage < 75) {
      status = 'Needs Consistency'
      statusColor = 'text-amber-500'
      StatusIcon = AlertCircle
    } else if (previousScore && !previousScore.is_absent) {
      if (latestScore.percentage > previousScore.percentage) {
        status = 'Improving'
        statusColor = 'text-green-500'
        StatusIcon = TrendingUp
      } else if (latestScore.percentage < previousScore.percentage) {
        status = 'Needs Attention'
        statusColor = 'text-red-500'
        StatusIcon = TrendingDown
      } else {
        status = 'Consistent'
        statusColor = 'text-blue-500'
        StatusIcon = CheckCircle2
      }
    } else {
      status = 'Good Start'
      statusColor = 'text-green-500'
      StatusIcon = TrendingUp
    }
  }

  // Chart Data preparation
  const chartData = validScores.map((s, i) => ({
    name: s.tests?.test_name || `Test ${i + 1}`,
    percentage: s.is_absent ? 0 : s.percentage,
    date: s.tests?.test_date,
    is_absent: s.is_absent
  }))

  const initials = student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  const latestSubjects = latestScore?.tests?.subjects
    ? normaliseSubjects(latestScore.tests.subjects)
    : []

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      
      {/* ── 1. HEADER & INSTITUTE BRAND (CLEAN & MINIMAL) ────────────────────── */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-lg shadow-blue-500/20 flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{instituteName}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs text-slate-300 font-medium">
                  Roll No: {student.roll_no}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs text-slate-300 font-medium">
                  Batch: {student.batch}
                </span>
                {student.standard && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#090d16] border border-slate-800 text-xs text-slate-300 font-medium">
                    Std: {student.standard}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Today's Attendance Live Pill */}
          <div className="w-full sm:w-auto self-stretch sm:self-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${todayBadgeClass}`}>
              <span className={`w-2 h-2 rounded-full ${todayDotClass}`} />
              <span>{todayStatusLabel}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 font-medium hidden sm:inline">
              Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. ATTENDANCE & DISCIPLINE HUB (WITH FULLY REACTIVE STATS BOX) ────── */}
      <div className="bg-[#111827] border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Attendance &amp; Classroom Engagement</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Switch between month, week, or overall all-time sessions
            </p>
          </div>

          <div className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
            dailyAttendancePercentage >= 75
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {attStatus}
          </div>
        </div>

        {/* Fully Interactive Component: Controls both Calendar and the Dynamic Stats Box */}
        <AttendanceCalendar records={attendanceRecords} />
      </div>

      {!latestScore ? (
        <div className="rounded-3xl p-12 text-center border border-slate-800/80 bg-[#111827] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#090d16] flex items-center justify-center mx-auto mb-4 border border-slate-800">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-white">No test results recorded yet.</h2>
          <p className="text-slate-400 text-sm">When the institute uploads test scores, comprehensive analytics will appear here.</p>
        </div>
      ) : (
        <>
          {/* ── 3. LATEST ASSESSMENT SCORECARD (HERO CARD) ───────────────────────── */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[90px] pointer-events-none" />

            {/* Test Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold uppercase tracking-wider">
                    Latest Assessment
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {latestScore.tests?.test_date ? new Date(latestScore.tests.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {latestScore.tests?.test_name || 'Latest Test'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Test Type: <span className="text-slate-300 capitalize">{latestScore.tests?.test_type || 'Weekly Test'}</span>
                </p>
              </div>

              {/* Status Pill */}
              {latestScore.is_absent ? (
                <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold">
                  Marked Absent
                </span>
              ) : (
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold ${
                  statusColor === 'text-green-500' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  statusColor === 'text-red-500' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                  statusColor === 'text-amber-500' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                  <StatusIcon className="w-4 h-4" />
                  <span>{status}</span>
                </div>
              )}
            </div>

            {/* 3 Prominent Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 py-6 border-b border-slate-800/80 text-center">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Score</p>
                <p className="text-xl sm:text-3xl font-extrabold text-white mt-1">
                  {latestScore.is_absent ? '0' : latestScore.total}
                  <span className="text-xs sm:text-sm text-slate-400 font-normal"> / {latestScore.tests?.max_marks || '-'}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batch Rank</p>
                <p className="text-xl sm:text-3xl font-extrabold text-purple-400 mt-1">
                  {latestScore.rank ? `#${latestScore.rank}` : '-'}
                  <span className="text-xs sm:text-sm text-slate-400 font-normal"> / {latestTestScores.length || '-'}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Percentile</p>
                <p className="text-xl sm:text-3xl font-extrabold text-pink-400 mt-1">
                  {latestScore.is_absent ? '0' : totalPercentile}
                  <span className="text-xs sm:text-sm text-slate-400 font-normal"> PR</span>
                </p>
              </div>
            </div>

            {/* Subject Breakdown in New Scorecard */}
            <div className="pt-6">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
                Subject-wise Performance Breakdown
              </h3>

              {latestScore.is_absent ? (
                <p className="text-sm text-slate-400 italic">Absent for latest test</p>
              ) : latestSubjects.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No subject data recorded</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
                  {latestSubjects.map((sub) => {
                    const score = latestScore.subject_scores?.[sub.name] ?? 0
                    const subMax = sub.max_marks > 0 ? sub.max_marks : latestScore.tests?.max_marks / latestSubjects.length
                    const perc = subMax > 0 ? Math.min(100, Math.round((score / subMax) * 100)) : 0
                    const subScores = latestTestScores.map(s => s.subject_scores?.[sub.name] ?? 0)
                    const subPercentile = calculatePercentile(score, subScores)
                    const barColor =
                      perc >= 60
                        ? 'from-emerald-500 to-green-500'
                        : perc >= 40
                        ? 'from-amber-500 to-yellow-500'
                        : 'from-rose-500 to-red-500'

                    return (
                      <div key={sub.name} className="bg-[#090d16] border border-slate-800 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold capitalize text-white">{sub.name}</span>
                          <span className="text-xs font-bold text-white">
                            {score} {subMax > 0 && <span className="text-slate-400 font-normal">/ {subMax}</span>}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                            style={{ width: `${perc}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-400">
                          <span>{perc}% Scored</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                            {subPercentile} PR
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── 4. RECENT TEST HISTORY TABLE (MOVED RIGHT AFTER LATEST TEST!) ────── */}
          <div>
            <div className="bg-[#111827] border border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Recent Tests</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Comprehensive history of past assessments</p>
                </div>
              </div>
              <RecentTestsTable scores={enhancedScores} />
            </div>
          </div>

          {/* ── 5. DETAILED ANALYTICS & CHARTS (MOVED TO BOTTOM) ────────────────── */}
          <div className="space-y-6 pt-2">
            {/* Subject Performance Donut Chart */}
            <SubjectPerformance scores={validScores} />

            {/* Performance Trend Line Chart */}
            <div className="bg-[#111827] border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-900/10 rounded-full blur-[80px]" />
              <h2 className="text-lg font-bold mb-6 relative z-10 text-white">Performance Trend</h2>
              <div className="h-[300px] w-full relative z-10">
                <PerformanceChart data={chartData} />
              </div>
            </div>
          </div>

          {/* ── 6. COACHING ACADEMIC REMARKS & INSIGHTS (EN / MR / HI TOGGLE) ──── */}
          <div>
            <PerformanceSummary
              studentName={student.name}
              studentId={studentId}
              latestScore={latestScore}
              previousScore={previousScore}
              scores={validScores}
              dailyAttendancePercentage={dailyAttendancePercentage}
              presentDays={presentDays}
              totalDays={totalDays}
            />
          </div>
        </>
      )}
    </div>
  )
}
