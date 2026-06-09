import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { createServerClient } from '@supabase/ssr'
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, 
  Calendar, Award, Target, BookOpen, AlertTriangle
} from 'lucide-react'
import PerformanceChart from './PerformanceChart'

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
  } catch (e) {
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
    .order('created_at', { ascending: true }) // Oldest to newest

  const validScores = scores || []
  
  // Sort by date (oldest to newest)
  validScores.sort((a, b) => {
    const dateA = new Date(a.tests?.test_date || a.created_at).getTime()
    const dateB = new Date(b.tests?.test_date || b.created_at).getTime()
    return dateA - dateB
  })

  // Attendance logic
  const totalTests = validScores.length
  const absentTests = validScores.filter(s => s.is_absent).length
  const presentTests = totalTests - absentTests
  const attendancePercentage = totalTests > 0 ? Math.round((presentTests / totalTests) * 100) : 100

  // Latest test logic
  const latestScore = validScores[validScores.length - 1]
  const previousScore = validScores.length > 1 ? validScores[validScores.length - 2] : null

  // Performance Status Engine
  let status = 'No Data'
  let statusColor = 'text-gray-400'
  let StatusIcon = AlertCircle

  if (latestScore) {
    if (latestScore.is_absent) {
      status = 'Absent'
      statusColor = 'text-gray-500'
      StatusIcon = AlertCircle
    } else if (attendancePercentage < 75) {
      status = 'Irregular Attendance'
      statusColor = 'text-yellow-400'
      StatusIcon = AlertTriangle
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

  return (
    <div className="space-y-8 pb-12">
      
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
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

      {/* ── ALERTS ────────────────────────────────────────────────────────── */}
      {absentTests > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-400">Attendance Alert</h3>
            <p className="text-sm text-red-400/80 mt-1">
              Student was absent for {absentTests} test{absentTests > 1 ? 's' : ''}. Check the notifications panel for details.
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
          {/* ── SUMMARY CARDS ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

            <div className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 rounded-2xl p-5 hover:border-emerald-500/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">Attendance</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{attendancePercentage}</span>
                <span className="text-sm text-white/40">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── PERFORMANCE TREND ────────────────────────────────────────────── */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
              <h2 className="text-lg font-bold mb-6 relative z-10">Performance Trend</h2>
              <div className="h-[300px] w-full relative z-10">
                <PerformanceChart data={chartData} />
              </div>
            </div>

            {/* ── SUBJECT PERFORMANCE ──────────────────────────────────────────── */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
              <h2 className="text-lg font-bold mb-6">Subject Breakdown</h2>
              {latestScore.is_absent ? (
                <div className="h-40 flex items-center justify-center text-sm text-white/40 italic">
                  Absent for latest test
                </div>
              ) : (
                <div className="space-y-5">
                  {latestScore.tests?.subjects?.map((sub: string) => {
                    const score = latestScore.subject_scores[sub] || 0
                    // Estimate subject percentage if max marks per subject isn't available
                    // Assuming equal weightage for subjects
                    const maxPerSubject = (latestScore.tests?.max_marks || 100) / latestScore.tests!.subjects.length
                    const perc = Math.min(100, Math.round((score / maxPerSubject) * 100))
                    
                    return (
                      <div key={sub}>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-medium capitalize text-white/90">{sub}</span>
                          <span className="text-xs font-bold text-white/70">{score} <span className="text-white/30 font-normal">marks</span></span>
                        </div>
                        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
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

          {/* ── RECENT TEST HISTORY ──────────────────────────────────────────── */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Tests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white/50 uppercase bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Test Name</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold text-center">Score</th>
                    <th className="px-6 py-4 font-semibold text-center">%</th>
                    <th className="px-6 py-4 font-semibold text-center">Rank</th>
                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...validScores].reverse().map((score) => (
                    <tr key={score.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white/90">{score.tests?.test_name}</p>
                        <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">{score.tests?.test_type || 'Test'}</p>
                      </td>
                      <td className="px-6 py-4 text-white/60 whitespace-nowrap">
                        {score.tests?.test_date ? new Date(score.tests.test_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {score.is_absent ? '-' : score.total}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {score.is_absent ? '-' : `${score.percentage}%`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {score.is_absent || !score.rank ? '-' : `#${score.rank}`}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {score.is_absent ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-semibold">
                            Absent
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-semibold">
                            Present
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
