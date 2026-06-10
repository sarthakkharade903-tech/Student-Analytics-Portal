import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { createServerClient } from '@supabase/ssr'
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  Calendar, Award, Target, BookOpen, AlertTriangle, Activity
} from 'lucide-react'
import PerformanceChart from './PerformanceChart'
import AttendanceChart from './AttendanceChart'
import AttendanceCalendar from './AttendanceCalendar'
import RecentTestsTable from './RecentTestsTable'
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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // Fetch Student
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (!student) {
    redirect('/parent/login')
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

  // Daily Attendance logic
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('date, is_present')
    .eq('student_id', studentId)
    .order('date', { ascending: true })

  const attendanceRecords = attendanceData || []
  const totalDays = attendanceRecords.length
  const presentDays = attendanceRecords.filter(r => r.is_present).length
  const absentDays = totalDays - presentDays
  const dailyAttendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100

  const monthlyAttMap = new Map<string, { total: number, present: number }>()
  attendanceRecords.forEach(r => {
    const d = new Date(r.date)
    const month = d.toLocaleString('default', { month: 'short' })
    const ex = monthlyAttMap.get(month) || { total: 0, present: 0 }
    ex.total++
    if (r.is_present) ex.present++
    monthlyAttMap.set(month, ex)
  })
  const attendanceChartData = Array.from(monthlyAttMap.entries()).map(([month, stats]) => ({
    month,
    percentage: Math.round((stats.present / stats.total) * 100)
  }))

  let attStatus = 'No Data'
  let attColor = 'text-white/50'
  let attBadge = 'bg-white/10 border-white/20'
  let circleColor = 'text-white/50'

  if (totalDays > 0) {
    if (dailyAttendancePercentage >= 75) {
      attStatus = dailyAttendancePercentage >= 90 ? 'Excellent Attendance' : 'Good Attendance'
      attColor = 'text-green-400'
      attBadge = 'bg-green-500/20 border-green-500/30'
      circleColor = 'text-green-400'
    } else if (dailyAttendancePercentage >= 50) {
      attStatus = 'Needs Attention'
      attColor = 'text-yellow-400'
      attBadge = 'bg-yellow-500/20 border-yellow-500/30'
      circleColor = 'text-yellow-400'
    } else {
      attStatus = 'Critical Attendance'
      attColor = 'text-red-400'
      attBadge = 'bg-red-500/20 border-red-500/30'
      circleColor = 'text-red-400'
    }
  }

  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (dailyAttendancePercentage / 100) * circumference

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
    // Normalise subjects
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
        percentage >= 75
          ? 'from-green-500 to-emerald-500'
          : percentage >= 50
          ? 'from-yellow-500 to-amber-500'
          : 'from-red-500 to-rose-500'

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
      statusColor = 'text-amber-400'
      StatusIcon = AlertCircle
    } else if (previousScore && !previousScore.is_absent) {
      if (latestScore.percentage > previousScore.percentage) {
        status = 'Improving'
        statusColor = 'text-green-400'
        StatusIcon = TrendingUp
      } else if (latestScore.percentage < previousScore.percentage) {
        status = 'Needs Attention'
        statusColor = 'text-red-400'
        StatusIcon = TrendingDown
      } else {
        status = 'Consistent'
        statusColor = 'text-blue-400'
        StatusIcon = CheckCircle2
      }
    } else {
      status = 'Good Start'
      statusColor = 'text-green-400'
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

  // Normalise subjects for the latest score's test (handles legacy string[] or new SubjectConfig[])
  const latestSubjects = latestScore?.tests?.subjects
    ? normaliseSubjects(latestScore.tests.subjects)
    : []

  return (
    <div className="space-y-8 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/70 font-medium">
                Roll No: {student.roll_no}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/70 font-medium">
                Batch: {student.batch}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {latestScore && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5`}>
              <StatusIcon className={`w-4 h-4 ${statusColor}`} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/50">Current Status</p>
              <p className={`text-sm font-semibold ${statusColor}`}>{status}</p>
            </div>
          </div>
        )}
      </div>

      {/* ALERTS */}
      {dailyAttendancePercentage < 75 && totalDays > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-400">⚠ Attendance Alert</h3>
            <p className="text-sm text-red-400/80 mt-1">
              Your attendance is currently {dailyAttendancePercentage}%. Regular attendance improves performance.
            </p>
          </div>
        </div>
      )}

      {!latestScore ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/10 bg-white/[0.02]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-white/40" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No test results available yet.</h2>
          <p className="text-white/50 text-sm">When the institute uploads test scores, they will appear here.</p>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-2xl p-5 hover:border-blue-500/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Latest Score</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{latestScore.is_absent ? '0' : latestScore.total}</span>
                <span className="text-sm text-white/40">/ {latestScore.tests?.max_marks || '-'}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Percentage</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{latestScore.is_absent ? '0' : latestScore.percentage}</span>
                <span className="text-sm text-white/40">%</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Latest Rank</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{latestScore.rank || '-'}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-2xl p-5 hover:border-pink-500/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Total Percentile</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{latestScore.is_absent ? '0' : totalPercentile}</span>
                <span className="text-sm text-white/40">PR</span>
              </div>
            </div>

            <div className={`bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-2xl p-5 transition-colors flex items-center justify-between`}>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-white/5`}>
                    <Calendar className="w-4 h-4 text-white/70" />
                  </div>
                  <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Attendance</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded border ${attBadge} ${attColor}`}>
                    {attStatus}
                  </span>
                </div>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`transition-all duration-1000 ease-out ${circleColor}`} />
                </svg>
                <span className="absolute text-sm font-bold">{dailyAttendancePercentage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* PERFORMANCE TREND */}
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
                <h2 className="text-lg font-bold mb-6 relative z-10">Performance Trend</h2>
                <div className="h-[300px] w-full relative z-10">
                  <PerformanceChart data={chartData} />
                </div>
              </div>

            {/* DAILY ATTENDANCE SUMMARY */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col items-center">
              <h2 className="text-lg font-bold mb-4 w-full text-left">Attendance Calendar</h2>
              <AttendanceCalendar records={attendanceRecords} />
              <div className="w-full grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{presentDays}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Present</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{absentDays}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider mt-1">Absent</div>
                </div>
              </div>
            </div>

            </div>

            <div className="lg:col-span-1">
              {/* SUBJECT BREAKDOWN */}
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
              <h2 className="text-lg font-bold mb-1">Subject Breakdown</h2>
              <p className="text-xs text-white/40 mb-5">Latest test performance</p>
              {latestScore.is_absent ? (
                <div className="h-40 flex items-center justify-center text-sm text-white/40 italic">
                  Absent for latest test
                </div>
              ) : latestSubjects.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-white/40 italic">
                  No subject data available
                </div>
              ) : (
                <div className="space-y-5">
                  {latestSubjects.map((sub) => {
                    const score = latestScore.subject_scores?.[sub.name] ?? 0
                    // Use the actual per-subject max_marks for accurate percentage
                    const subMax = sub.max_marks > 0 ? sub.max_marks : latestScore.tests?.max_marks / latestSubjects.length
                    const perc = subMax > 0 ? Math.min(100, Math.round((score / subMax) * 100)) : 0
                    
                    const subScores = latestTestScores.map(s => s.subject_scores?.[sub.name] ?? 0)
                    const subPercentile = calculatePercentile(score, subScores)

                    const barColor =
                      perc >= 75
                        ? 'from-green-500 to-emerald-500'
                        : perc >= 50
                        ? 'from-yellow-500 to-amber-500'
                        : 'from-red-500 to-rose-500'

                    return (
                      <div key={sub.name}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-medium capitalize text-white/90">{sub.name}</span>
                          <div className="text-right flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-white/70">
                              {score}
                              {sub.max_marks > 0 && (
                                <span className="text-white/30 font-normal"> / {sub.max_marks}</span>
                              )}
                            </span>
                            <span className="text-[10px] text-white/40">({perc}%)</span>
                            {!latestScore.is_absent && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                                {subPercentile} PR
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${perc}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            </div>
          </div>

          <div className="mt-6">
            {/* RECENT TEST HISTORY */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold">Recent Tests</h2>
              </div>
              <RecentTestsTable scores={enhancedScores} />
            </div>
        </div>
        </>
      )}
    </div>
  )
}
