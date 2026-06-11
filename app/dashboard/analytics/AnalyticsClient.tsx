'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle, MessageCircle, Copy, CheckCircle2,
  Users, BarChart2, CalendarX, TrendingDown, ShieldAlert,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskType = 'attendance' | 'consecutive_absent' | 'low_percentile'
type PriorityLevel = 'High' | 'Medium' | 'Low'

interface AtRiskStudent {
  student_id: string
  student_name: string
  batch: string
  parent_phone: string | null
  risk_types: RiskType[]
  att_pct: number | null
  total_sessions: number | null
  attended_sessions: number | null
  recent_prs: number[] | null
}

interface Props {
  coachingCenterId: string
  atRiskStudents: AtRiskStudent[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPriorityLevel(student: AtRiskStudent): PriorityLevel {
  const types = student.risk_types || []
  if (types.includes('consecutive_absent') || (types.includes('attendance') && (student.att_pct ?? 100) < 30)) {
    return 'High'
  }
  if (types.includes('low_percentile')) {
    return 'Medium'
  }
  if (types.includes('attendance') && (student.att_pct ?? 100) >= 30) {
    return 'Low'
  }
  return 'Low' // fallback
}

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
}

const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  High: 'text-red-400 bg-red-500/15 border-red-500/20',
  Medium: 'text-orange-400 bg-orange-500/15 border-orange-500/20',
  Low: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/20',
}

// Build tailored WhatsApp message
function buildMessage(student: AtRiskStudent): string {
  const name = student.student_name
  const batch = student.batch
  const types = student.risk_types || []

  const parts: string[] = []

  if (types.includes('attendance')) {
    parts.push(
      `${name}'s attendance has dropped to ${student.att_pct}% in the last 30 days (${student.attended_sessions}/${student.total_sessions} classes attended). ` +
      `Regular attendance is critical for competitive exam preparation. ` +
      `Please ensure they attend classes consistently.`
    )
  }
  if (types.includes('consecutive_absent')) {
    parts.push(
      `${name} has been absent for the last 3 tests. ` +
      `Missing tests heavily impacts exam readiness and rank evaluation. ` +
      `Please connect with us to help them catch up and resume giving mock tests.`
    )
  }
  if (types.includes('low_percentile')) {
    const prString = student.recent_prs ? student.recent_prs.join(' → ') : ''
    parts.push(
      `${name} has been consistently performing below the expected average in recent tests (Recent PRs: ${prString}). ` +
      `With some focused effort, doubt clearing, and guidance, this can be turned around quickly.`
    )
  }

  return (
    `Hello! This is a message from the coaching institute regarding ${name} (Batch: ${batch}).\n\n` +
    parts.join('\n\n') +
    `\n\nPlease feel free to reach out to us — we are here to support ${name}'s success. 🙏`
  )
}

function buildWhatsAppLink(student: AtRiskStudent): string | null {
  if (!student.parent_phone) return null
  const digits = String(student.parent_phone).replace(/\D/g, '')
  if (digits.length < 10) return null
  const phone = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(student))}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsClient({ atRiskStudents }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Sort primarily by Priority, then alphabetically
  const sortedAtRisk = useMemo(() => {
    return [...atRiskStudents].sort((a, b) => {
      const pA = PRIORITY_ORDER[getPriorityLevel(a)]
      const pB = PRIORITY_ORDER[getPriorityLevel(b)]
      if (pA !== pB) return pB - pA
      return a.student_name.localeCompare(b.student_name)
    })
  }, [atRiskStudents])

  const groupedStudents = useMemo(() => {
    const groups: Record<PriorityLevel, AtRiskStudent[]> = { High: [], Medium: [], Low: [] }
    sortedAtRisk.forEach(s => groups[getPriorityLevel(s)].push(s))
    return groups
  }, [sortedAtRisk])

  const handleCopyMessage = (student: AtRiskStudent) => {
    navigator.clipboard.writeText(buildMessage(student))
    setCopiedId(student.student_id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const renderStudentRow = (student: AtRiskStudent) => {
    const waLink = buildWhatsAppLink(student)
    const hasPhone = !!waLink
    const isCopied = copiedId === student.student_id
    const types = student.risk_types || []
    const priority = getPriorityLevel(student)

    const priorityBorder = 
      priority === 'High' ? 'border-l-red-500' :
      priority === 'Medium' ? 'border-l-orange-500' : 'border-l-yellow-500'

    return (
      <div
        key={student.student_id}
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 bg-white/[0.02] border border-white/5 border-l-4 ${priorityBorder} hover:bg-white/[0.04] transition-all rounded-xl`}
      >
        <div className="flex items-start gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <p className="text-base font-bold tracking-wide">{student.student_name}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${PRIORITY_COLORS[priority]} shadow-sm`}>
                {priority} Priority
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">
              Batch: <span className="font-medium text-white/70">{student.batch}</span>
              <span className="mx-2">•</span>
              {hasPhone ? <span className="text-green-400">Phone Available</span> : <span className="text-red-400">No Phone</span>}
            </p>
            
            {/* Specific Risk Reasons Listed as Pills */}
            <div className="flex flex-wrap gap-2">
              {types.includes('consecutive_absent') && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Missed 3 Tests
                </span>
              )}
              {types.includes('attendance') && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-300">
                  <CalendarX className="w-3.5 h-3.5" />
                  Attendance {student.att_pct}% ({student.attended_sessions}/{student.total_sessions})
                </span>
              )}
              {types.includes('low_percentile') && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-300">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Low PR ({student.recent_prs ? student.recent_prs.join(' → ') : ''})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 md:pl-0 mt-2 md:mt-0">
          {hasPhone ? (
            <a
              href={waLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm font-bold whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Parent
            </a>
          ) : (
            <button
              onClick={() => handleCopyMessage(student)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-sm font-bold whitespace-nowrap ${
                isCopied
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
              }`}
            >
              {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'Message Copied!' : 'Copy Message'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/20 flex items-center justify-center shadow-lg shadow-[var(--primary)]/5">
            <Users className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parent Follow-ups</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Identify at-risk students and coordinate outreach to prevent dropouts
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Total in Queue</span>
            <span className="text-2xl font-bold">{atRiskStudents.length}</span>
          </div>
        </div>
      </div>

      {sortedAtRisk.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-white/5 bg-white/[0.01]">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Inbox Zero</h3>
          <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
            Great job! No students are currently flagged for low attendance or poor performance.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* High Priority Group */}
          {groupedStudents.High.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-bold text-white">Needs Immediate Action</h2>
                <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {groupedStudents.High.length}
                </span>
              </div>
              <div className="grid gap-3">
                {groupedStudents.High.map(renderStudentRow)}
              </div>
            </section>
          )}

          {/* Medium Priority Group */}
          {groupedStudents.Medium.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-bold text-white">Needs Attention</h2>
                <span className="bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {groupedStudents.Medium.length}
                </span>
              </div>
              <div className="grid gap-3">
                {groupedStudents.Medium.map(renderStudentRow)}
              </div>
            </section>
          )}

          {/* Low Priority Group */}
          {groupedStudents.Low.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-white">Under Observation</h2>
                <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {groupedStudents.Low.length}
                </span>
              </div>
              <div className="grid gap-3">
                {groupedStudents.Low.map(renderStudentRow)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
