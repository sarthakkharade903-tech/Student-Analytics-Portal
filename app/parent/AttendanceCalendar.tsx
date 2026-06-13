'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AttendanceCalendar({ records }: { records: { date: string, is_present: boolean }[] }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const recordMap = new Map(records.map(r => [r.date, r.is_present]))

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isPresent = recordMap.get(dateStr)
    
    let bgColor = 'bg-slate-800 hover:bg-slate-700 text-slate-500'
    if (isPresent === true) bgColor = 'bg-green-500/20 text-green-400 font-bold border border-green-500/30'
    if (isPresent === false) bgColor = 'bg-red-500/20 text-red-400 font-bold border border-red-500/30'

    const isToday = dateStr === today.toISOString().split('T')[0]
    if (isToday && isPresent === undefined) {
      bgColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    }

    days.push(
      <div
        key={day}
        title={isPresent === true ? 'Present' : isPresent === false ? 'Absent' : 'No Record'}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors cursor-default mx-auto ${bgColor}`}
      >
        {day}
      </div>
    )
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 gap-y-2">
        {days}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" /> Present</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" /> Absent</div>
      </div>
    </div>
  )
}
