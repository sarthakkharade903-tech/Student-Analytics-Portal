'use client'
// Cache busting comment to force Next.js HMR rebuild: 1

import { useMemo, useState } from 'react'
import {
  AlertTriangle, MessageCircle, Copy, CheckCircle2,
  Users, BarChart2, CalendarX, TrendingDown, ShieldAlert,
  ArrowRight, PhoneCall
} from 'lucide-react'
import StandardTabs from '@/components/dashboard/StandardTabs'

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
  return 'Low'
}

const PRIORITY_ORDER: Record<PriorityLevel, number> = { High: 3, Medium: 2, Low: 1 }

const PRIORITY_COLORS: Record<PriorityLevel, { text: string, bg: string, border: string, glow: string }> = {
  High: { text: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-300', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' },
  Medium: { text: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
  Low: { text: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
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
    `\n\nPlease feel free to reach out to us - we are here to support ${name}'s success. ${String.fromCodePoint(0x1F64F)}`
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
    const colors = PRIORITY_COLORS[priority]

    return (
      <div
        key={student.student_id}
        className={`relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 bg-white/80 backdrop-blur-md border ${colors.border} rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${colors.glow} group`}
        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      >
        {/* Subtle Background Accent */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-[60px] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
        
        <div className="flex items-start gap-4 min-w-0 relative z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1.5">
              <h3 className="text-lg font-extrabold tracking-wide text-gray-900 drop-shadow-md">{student.student_name}</h3>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                {priority} Priority
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-medium">
              <div className="bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                Batch: <span className="text-gray-800 ml-1">{student.batch}</span>
              </div>
              {hasPhone ? (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <PhoneCall className="w-3.5 h-3.5" /> Phone Verified
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  <PhoneCall className="w-3.5 h-3.5" /> No Phone
                </div>
              )}
            </div>
            
            {/* Risk Reason Pills with 3D inset styling */}
            <div className="flex flex-wrap gap-2.5">
              {types.includes('consecutive_absent') && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs font-bold text-orange-600 shadow-inner">
                  <AlertTriangle className="w-4 h-4" />
                  Missed 3 Tests
                </span>
              )}
              {types.includes('attendance') && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 shadow-inner">
                  <CalendarX className="w-4 h-4" />
                  Attendance {student.att_pct}% <span className="text-rose-500/70">({student.attended_sessions}/{student.total_sessions})</span>
                </span>
              )}
              {types.includes('low_percentile') && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-600 shadow-inner">
                  <TrendingDown className="w-4 h-4" />
                  Low PR <span className="text-amber-500/70">({student.recent_prs ? student.recent_prs.join(' → ') : ''})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 relative z-10 mt-2 md:mt-0">
          {hasPhone ? (
            <a
              href={waLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm font-bold whitespace-nowrap"
            >
              <MessageCircle className="w-5 h-5 drop-shadow-md" />
              WhatsApp Parent
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-300" />
            </a>
          ) : (
            <button
              onClick={() => handleCopyMessage(student)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm font-bold whitespace-nowrap shadow-lg ${
                isCopied
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300'
              }`}
            >
              {isCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
              {isCopied ? 'Message Copied!' : 'Copy Script'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-10 relative">
      
      {/* Ambient Background Blur */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-[-1]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-200 relative">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blur opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-white/20 flex items-center justify-center shadow-2xl">
              <Users className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Action Center
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1.5 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Identify at-risk students & coordinate outreach
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-inner">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Flags</span>
            <span className="text-3xl font-black text-gray-900 drop-shadow-md">{atRiskStudents.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
            <BarChart2 className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </div>

      <StandardTabs />

      {/* Stats Summary Panel */}
      {sortedAtRisk.length === 0 ? (
        <div className="relative rounded-3xl p-16 text-center border border-gray-200 bg-gradient-to-b from-gray-50 to-transparent overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none" />
          <div className="relative w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] border border-emerald-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 drop-shadow-lg" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-wide">Inbox Zero</h3>
          <p className="text-gray-500 max-w-md mx-auto font-medium text-base">
            Incredible! No students are currently flagged for critical low attendance or poor performance. Keep up the great work!
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* High Priority Group */}
          {groupedStudents.High.length > 0 && (
            <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-lg bg-rose-100 border border-rose-200">
                  <ShieldAlert className="w-5 h-5 text-rose-600 drop-shadow-md" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-wide">Needs Immediate Action</h2>
                <span className="bg-rose-100 text-rose-600 text-sm font-black px-3 py-0.5 rounded-full border border-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.1)] ml-2">
                  {groupedStudents.High.length}
                </span>
              </div>
              <div className="grid gap-4 pl-2 md:pl-4">
                {groupedStudents.High.map(renderStudentRow)}
              </div>
            </section>
          )}

          {/* Medium Priority Group */}
          {groupedStudents.Medium.length > 0 && (
            <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-lg bg-amber-100 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 drop-shadow-md" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-wide">Needs Attention</h2>
                <span className="bg-amber-100 text-amber-600 text-sm font-black px-3 py-0.5 rounded-full border border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.1)] ml-2">
                  {groupedStudents.Medium.length}
                </span>
              </div>
              <div className="grid gap-4 pl-2 md:pl-4">
                {groupedStudents.Medium.map(renderStudentRow)}
              </div>
            </section>
          )}

          {/* Low Priority Group */}
          {groupedStudents.Low.length > 0 && (
            <section className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center gap-3 px-2">
                <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 drop-shadow-md" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-wide">Under Observation</h2>
                <span className="bg-emerald-100 text-emerald-600 text-sm font-black px-3 py-0.5 rounded-full border border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.1)] ml-2">
                  {groupedStudents.Low.length}
                </span>
              </div>
              <div className="grid gap-4 pl-2 md:pl-4">
                {groupedStudents.Low.map(renderStudentRow)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
