import React from 'react'
import { LucideIcon, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: React.ReactNode
  icon: LucideIcon
  description?: string
  trend?: string
  color?: 'purple' | 'blue' | 'green' | 'orange'
}

const colorStyles = {
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    hover: 'hover:border-purple-200 hover:shadow-purple-100/50',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    hover: 'hover:border-blue-200 hover:shadow-blue-100/50',
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    hover: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    hover: 'hover:border-orange-200 hover:shadow-orange-100/50',
  },
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'purple',
}: StatCardProps) {
  const styles = colorStyles[color]

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 group flex flex-col ${styles.hover} hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between mb-6">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.bg} ${styles.text}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" />
            {trend}
          </div>
        )}
      </div>
      <div>
        <div
          className="text-3xl font-bold mb-1.5"
          style={{ color: value === '--' || value === 0 ? '#94a3b8' : '#1e293b' }}
        >
          {value}
        </div>
        <div className="text-sm font-semibold text-slate-600 mb-1">{title}</div>
        {description && (
          <div className="text-sm text-slate-400">{description}</div>
        )}
      </div>
    </div>
  )
}
