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
    
    let bgColor = 'bg-gray-100 hover:bg-gray-200 text-gray-400'
    if (isPresent === true) bgColor = 'bg-green-100 text-green-700 font-bold border border-green-200'
    if (isPresent === false) bgColor = 'bg-red-100 text-red-700 font-bold border border-red-200'

    const isToday = dateStr === today.toISOString().split('T')[0]
    if (isToday && isPresent === undefined) {
      bgColor = 'bg-blue-100 text-blue-700 border border-blue-200'
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
        <button onClick={prevMonth} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 gap-y-2">
        {days}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-gray-500 font-medium uppercase tracking-wider">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-200 border border-green-300" /> Present</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-200 border border-red-300" /> Absent</div>
      </div>
    </div>
  )
}
