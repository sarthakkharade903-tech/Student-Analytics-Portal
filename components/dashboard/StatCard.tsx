import { LucideIcon, TrendingUp } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: string
  color?: 'purple' | 'blue' | 'green' | 'orange'
}

const colorMap = {
  purple: 'oklch(0.62 0.22 265)',
  blue: 'oklch(0.60 0.20 230)',
  green: 'oklch(0.65 0.18 145)',
  orange: 'oklch(0.68 0.20 60)',
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'purple',
}: StatCardProps) {
  const colorVal = colorMap[color]

  return (
    <div
      className="glass-card rounded-2xl p-6 hover:border-[oklch(0.62_0.22_265/0.4)] transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${colorVal}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: colorVal }} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div
        className="text-3xl font-bold mb-1"
        style={{ color: value === '--' || value === 0 ? 'var(--muted-foreground)' : 'var(--foreground)' }}
      >
        {value}
      </div>
      <div className="text-sm font-medium text-[var(--foreground)] mb-0.5">{title}</div>
      {description && (
        <div className="text-xs text-[var(--muted-foreground)]">{description}</div>
      )}
    </div>
  )
}
