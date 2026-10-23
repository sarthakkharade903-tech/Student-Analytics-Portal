'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, LayoutGrid, CalendarDays, CheckCircle2, Clock } from 'lucide-react'

interface AttendanceRecord {
  date: string
  is_present: boolean
}

export default function AttendanceCalendar({ records }: { records: AttendanceRecord[] }) {
  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [activePeriod, setActivePeriod] = useState<'month' | 'week' | 'overall'>('month')

  const recordMap = useMemo(() => new Map(records.map(r => [r.date, r.is_present])), [records])

  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }, [today])

  // ── Month Calculations ─────────────────────────────────────────────────────
  const monthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
  const monthRecords = useMemo(() => {
    return records.filter(r => r.date.startsWith(monthPrefix))
  }, [records, monthPrefix])

  const monthPresent = monthRecords.filter(r => r.is_present).length
  const monthAbsent = monthRecords.filter(r => !r.is_present).length
  const monthTotal = monthRecords.length
  const monthPct = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 0

  // ── Last 7 Days Calculations ───────────────────────────────────────────────
  const last7DaysRecords = useMemo(() => {
    const dates: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates.map(dStr => ({
      date: dStr,
      is_present: recordMap.get(dStr)
    }))
  }, [today, recordMap])

  const weekPresent = last7DaysRecords.filter(r => r.is_present === true).length
  const weekAbsent = last7DaysRecords.filter(r => r.is_present === false).length
  const weekTotal = weekPresent + weekAbsent
  const weekPct = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0

  // ── Overall Calculations ───────────────────────────────────────────────────
  const overallPresent = records.filter(r => r.is_present).length
  const overallAbsent = records.filter(r => !r.is_present).length
  const overallTotal = records.length
  const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0

  // ── Active Statistics for the Right-Hand Black Box ─────────────────────────
  const stats = useMemo(() => {
    if (activePeriod === 'week') {
      const label = 'PAST 7 DAYS ATTENDANCE'
      const sessionText = `${weekPresent} of ${weekTotal} class sessions attended this week`
      const facultyText = weekTotal === 0
        ? 'No class sessions were scheduled over the past 7 days.'
        : weekAbsent === 0
        ? '100% attendance maintained this past week. Excellent classroom consistency.'
        : `${weekAbsent} session(s) missed in the past 7 days. Reviewing lecture notes with peers or faculty is advised.`

      return {
        label,
        rate: weekPct,
        present: weekPresent,
        absent: weekAbsent,
        total: weekTotal,
        sessionText,
        facultyText,
        periodName: 'Past 7 Days'
      }
    }

    if (activePeriod === 'overall') {
      const label = 'CUMULATIVE ALL-TIME ATTENDANCE'
      const sessionText = `${overallPresent} of ${overallTotal} total class sessions attended`
      const facultyText = overallPct >= 75
        ? `Cumulative attendance (${overallPct}%) meets institute requirements for sustained exam readiness.`
        : `Cumulative attendance stands at ${overallPct}%. Consistent classroom presence directly improves competitive exam speed.`

      return {
        label,
        rate: overallPct,
        present: overallPresent,
        absent: overallAbsent,
        total: overallTotal,
        sessionText,
        facultyText,
        periodName: 'Overall'
      }
    }

    // Default: 'month'
    const currentMonthName = currentMonth.toLocaleString('default', { month: 'long' })
    const label = `${currentMonthName.toUpperCase()} ATTENDANCE`
    const sessionText = `${monthPresent} of ${monthTotal} class sessions attended this month`
    const facultyText = monthPct >= 75
      ? `Regular presence (${monthPct}%) in ${currentMonthName} ensures complete coverage of weekly syllabus topics.`
      : `Current presence is at ${monthPct}%. Attending remaining sessions this month will help achieve the recommended 75% target.`

    return {
      label,
      rate: monthPct,
      present: monthPresent,
      absent: monthAbsent,
      total: monthTotal,
      sessionText,
      facultyText,
      periodName: currentMonthName
    }
  }, [activePeriod, currentMonth, weekPresent, weekAbsent, weekTotal, weekPct, overallPresent, overallAbsent, overallTotal, overallPct, monthPresent, monthAbsent, monthTotal, monthPct])

  // SVG Radial Ring Metrics
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (stats.rate / 100) * circumference
  const circleColor = stats.rate >= 75 ? 'text-emerald-400' : stats.rate >= 50 ? 'text-amber-400' : 'text-rose-400'

  // Missed days in currently viewed month
  const missedDaysInMonth = useMemo(() => {
    return monthRecords
      .filter(r => !r.is_present)
      .map(r => {
        const d = new Date(r.date)
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      })
  }, [monthRecords])

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  // Build month grid cells
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const monthGridDays = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    monthGridDays.push(<div key={`empty-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isPresent = recordMap.get(dateStr)
    const isToday = dateStr === todayStr

    let cellStyle = 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 border border-slate-800/80'
    let statusLabel = 'No Class Scheduled'

    if (isPresent === true) {
      cellStyle = 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
      statusLabel = 'Present'
    } else if (isPresent === false) {
      cellStyle = 'bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30'
      statusLabel = 'Absent'
    }

    if (isToday) {
      cellStyle += ' ring-2 ring-blue-500 ring-offset-1 ring-offset-[#090d16]'
    }

    monthGridDays.push(
      <div
        key={day}
        title={`${day} ${currentMonth.toLocaleString('default', { month: 'short' })}: ${statusLabel}${isToday ? ' (Today)' : ''}`}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs font-medium transition-all mx-auto select-none ${cellStyle}`}
      >
        {day}
      </div>
    )
  }

  // Build week strip days (Mon - Sun)
  const weekStripDays = useMemo(() => {
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const strip = []
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const isPresent = recordMap.get(dStr)
      const isToday = dStr === todayStr

      strip.push({
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        dateStr: dStr,
        isPresent,
        isToday
      })
    }
    return strip
  }, [today, recordMap, todayStr])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handlePeriodClick = (p: 'month' | 'week' | 'overall') => {
    setActivePeriod(p)
    if (p === 'week') setViewMode('week')
    if (p === 'month') setViewMode('month')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      
      {/* ── LEFT COLUMN: CALENDAR & FILTERS ─────────────────────────────────── */}
      <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
        
        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          
          {/* Period Filter Pills */}
          <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => handlePeriodClick('month')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePeriod === 'month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handlePeriodClick('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePeriod === 'week'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePeriodClick('overall')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activePeriod === 'overall'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overall
            </button>
          </div>

          {/* Month vs Week View Switcher */}
          <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-slate-800 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('month')}
              title="Month Grid View"
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'month' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              title="Week Strip View"
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'week' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Period Quick Summary Line */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 font-medium">{stats.periodName}:</span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{stats.present} Present</span>
            <span className="text-slate-600">·</span>
            <span className="text-rose-400 font-bold">{stats.absent} Absent</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20 text-[11px]">
              {stats.rate}%
            </span>
          </div>
        </div>

        {/* ── VIEW A: MONTH GRID VIEW ───────────────────────────────────────── */}
        {viewMode === 'month' && (
          <div className="animate-in fade-in space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white tracking-wide">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg bg-[#090d16] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg bg-[#090d16] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5 gap-y-2">
              {monthGridDays}
            </div>

            {/* Missed Days Chips */}
            {missedDaysInMonth.length > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#090d16] border border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-rose-400 font-semibold flex items-center gap-1 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5" /> Missed:
                </span>
                {missedDaysInMonth.map((dStr, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 font-medium border border-rose-500/20 text-[11px]">
                    {dStr}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW B: WEEK STRIP VIEW ───────────────────────────────────────── */}
        {viewMode === 'week' && (
          <div className="animate-in fade-in space-y-2 py-2">
            <p className="text-xs text-slate-400 px-1 font-medium">Current Week Daily Attendance:</p>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekStripDays.map((item) => {
                let dotBg = 'bg-slate-700/60'
                let borderStyle = 'border-slate-800 bg-[#090d16]'
                let textColor = 'text-slate-400'

                if (item.isPresent === true) {
                  dotBg = 'bg-emerald-400'
                  borderStyle = 'border-emerald-500/30 bg-emerald-500/10'
                  textColor = 'text-emerald-300 font-bold'
                } else if (item.isPresent === false) {
                  dotBg = 'bg-rose-400'
                  borderStyle = 'border-rose-500/30 bg-rose-500/10'
                  textColor = 'text-rose-300 font-bold'
                }

                if (item.isToday) {
                  borderStyle += ' ring-2 ring-blue-500 ring-offset-1 ring-offset-[#090d16]'
                }

                return (
                  <div
                    key={item.dateStr}
                    title={`${item.dayName} ${item.dayNumber}: ${item.isPresent === true ? 'Present' : item.isPresent === false ? 'Absent' : 'No Class'}`}
                    className={`p-2 rounded-xl text-center border flex flex-col items-center justify-between gap-1 transition-all ${borderStyle}`}
                  >
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.dayName}</span>
                    <span className={`text-xs ${textColor}`}>{item.dayNumber}</span>
                    <span className={`w-2 h-2 rounded-full ${dotBg} mt-0.5`} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-blue-400" />
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: DYNAMIC STATS BLACK BOX (UPDATES ON EVERY CLICK!) ─── */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-[#090d16] p-5 rounded-2xl border border-slate-800/80 transition-all">
        
        {/* Dynamic Header & Rate */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stats.label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">{stats.rate}%</span>
              <span className="text-xs text-slate-400">rate</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.sessionText}
            </p>
          </div>

          {/* Dynamic Radial Progress Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
            <svg className="transform -rotate-90 w-16 h-16">
              <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-800" />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-700 ease-out ${circleColor}`}
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">{stats.rate}%</span>
          </div>
        </div>

        {/* Dynamic Present / Absent Counters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-400">{stats.present}</div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Present Days</div>
          </div>
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-rose-400">{stats.absent}</div>
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Absent Days</div>
          </div>
        </div>

        {/* Dynamic Faculty Observation for the Active Period */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
          <p className="text-slate-300 leading-snug">
            <span className="font-semibold text-white">Faculty Observation:</span>{' '}
            {stats.facultyText}
          </p>
        </div>
      </div>

    </div>
  )
}
