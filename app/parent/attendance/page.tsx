import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AttendanceMark from '@/app/portal/dashboard/AttendanceMark'
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function ParentAttendancePage() {
  const cookieStore = await cookies()
  const studentId = cookieStore.get('portal_session')?.value
  if (!studentId) redirect('/portal')

  const supabase = await createClient()

  // Fetch student info
  const { data: student } = await supabase
    .from('students')
    .select('id, name, standard, coaching_center_id')
    .eq('id', studentId)
    .single()

  if (!student) redirect('/portal')

  // Fetch last 30 days of attendance for this student
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const { data: records } = await supabase
    .from('attendance')
    .select('date, is_present, is_late')
    .eq('student_id', studentId)
    .gte('date', fromDate)
    .order('date', { ascending: false })

  const attendanceMap = new Map<string, { is_present: boolean; is_late: boolean }>()
  ;(records ?? []).forEach((r: any) => {
    attendanceMap.set(r.date, { is_present: r.is_present, is_late: r.is_late ?? false })
  })

  const totalDays = records?.length ?? 0
  const presentDays = records?.filter((r: any) => r.is_present).length ?? 0
  const lateDays = records?.filter((r: any) => r.is_late).length ?? 0
  const absentDays = totalDays - presentDays
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <main className="relative max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Attendance</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Last 30 days</p>
          </div>
        </div>

        {/* Mark Attendance Card */}
        <AttendanceMark
          studentId={student.id}
          standard={student.standard ?? '11th'}
          date={today}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase font-semibold tracking-wide mb-1">Attendance %</p>
            <p className={`text-3xl font-bold ${percentage >= 75 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {percentage}%
            </p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase font-semibold tracking-wide mb-1">Present</p>
            <p className="text-3xl font-bold text-green-400">{presentDays}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase font-semibold tracking-wide mb-1">Absent</p>
            <p className="text-3xl font-bold text-red-400">{absentDays}</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-[var(--muted-foreground)] uppercase font-semibold tracking-wide mb-1">Late</p>
            <p className="text-3xl font-bold text-orange-400">{lateDays}</p>
          </div>
        </div>

        {/* Day-by-day list */}
        <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border)]">
          <div className="px-5 py-4 border-b border-[var(--border)] bg-black/5">
            <h2 className="font-semibold text-sm">Daily Record</h2>
          </div>
          {totalDays === 0 ? (
            <div className="py-12 text-center text-[var(--muted-foreground)] text-sm">
              No attendance records in the last 30 days.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {(records ?? []).map((r: any) => {
                const rec = attendanceMap.get(r.date)
                const isPresent = rec?.is_present ?? false
                const isLate = rec?.is_late ?? false
                const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('en-IN', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })
                return (
                  <div key={r.date} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-[var(--foreground)]">{dateStr}</span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      !isPresent
                        ? 'bg-red-500/10 text-red-400'
                        : isLate
                        ? 'bg-orange-500/10 text-orange-400'
                        : 'bg-green-500/10 text-green-400'
                    }`}>
                      {!isPresent ? (
                        <><XCircle className="w-3 h-3" /> Absent</>
                      ) : isLate ? (
                        <><Clock className="w-3 h-3" /> Late</>
                      ) : (
                        <><CheckCircle2 className="w-3 h-3" /> Present</>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
