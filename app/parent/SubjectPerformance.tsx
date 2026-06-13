'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, AlertTriangle, Target, Award } from 'lucide-react'

// Array of vibrant, attractive colors for the pie chart
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#14b8a6', '#f43f5e']

export default function SubjectPerformance({ scores }: { scores: any[] }) {
  const analytics = useMemo(() => {
    if (!scores || scores.length === 0) return null

    const presentScores = scores.filter(s => !s.is_absent && s.subject_scores)
    if (presentScores.length === 0) return null

    // Calculate averages per subject
    const subjectMap = new Map<string, { totalPct: number; count: number; firstPct: number; lastPct: number }>()

    presentScores.forEach((score) => {
      const tests = score.tests
      if (!tests?.subjects) return
      
      const subScores = score.subject_scores || {}
      
      tests.subjects.forEach((sub: any) => {
        const name = typeof sub === 'string' ? sub : sub.name
        const max = typeof sub === 'string' ? 0 : sub.max_marks || 0
        if (max > 0 && typeof subScores[name] === 'number') {
          const pct = (subScores[name] / max) * 100
          
          if (!subjectMap.has(name)) {
            subjectMap.set(name, { totalPct: pct, count: 1, firstPct: pct, lastPct: pct })
          } else {
            const data = subjectMap.get(name)!
            data.totalPct += pct
            data.count += 1
            data.lastPct = pct // since scores are chronological
            subjectMap.set(name, data)
          }
        }
      })
    })

    if (subjectMap.size === 0) return null

    const aggregated = Array.from(subjectMap.entries()).map(([name, data]) => ({
      name,
      avgPct: data.totalPct / data.count,
      improvement: data.count > 1 ? data.lastPct - data.firstPct : 0
    }))

    // Sort to find Strongest, Weakest, Improved
    const sortedByAvg = [...aggregated].sort((a, b) => b.avgPct - a.avgPct)
    const sortedByImp = [...aggregated].sort((a, b) => b.improvement - a.improvement)

    const strongest = sortedByAvg[0]
    const weakest = sortedByAvg[sortedByAvg.length - 1]
    const mostImproved = sortedByImp[0]

    // Prepare pie chart data
    const pieData = aggregated.map((d, index) => ({
      name: d.name,
      value: Math.round(d.avgPct),
      fill: COLORS[index % COLORS.length]
    }))

    return { strongest, weakest, mostImproved, pieData }
  }, [scores])

  if (!analytics) {
    return (
      <div className="rounded-3xl p-6 lg:p-8 flex flex-col items-center justify-center min-h-[300px] border border-slate-800 bg-[#1a2540] text-center shadow-sm">
        <Target className="w-12 h-12 text-[var(--muted-foreground)] opacity-50 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Subject Performance</h3>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
          Not enough test data to analyze subject performance yet. Complete some tests with subject-wise marks to see your strongest and weakest subjects here.
        </p>
      </div>
    )
  }

  const { strongest, weakest, mostImproved, pieData } = analytics

  return (
    <div className="rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-[#1a2540] border border-slate-800 shadow-sm">
      
      {/* 3D Background Glow Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Left: Pie Chart */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative z-10">
        <h3 className="text-lg font-bold mb-2 text-white">Subject Performance</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-6 text-center">Average percentage across all tests</p>
        
        <div className="w-full h-64 relative drop-shadow-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
                cornerRadius={8}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0px 4px 12px ${entry.fill}40)` }} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f1729', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value}%`, 'Average']}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Inner Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-36px' }}>
            <div className="text-center">
              <span className="text-2xl font-bold text-white">{Math.round(pieData.reduce((a, b) => a + b.value, 0) / pieData.length)}%</span>
              <span className="block text-[10px] text-[var(--muted-foreground)] uppercase">Avg All</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Key Insights */}
      <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        
        {/* Strongest Subject */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:bg-slate-800 hover:border-green-500/50 transition-all group shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Strongest</h4>
          </div>
          <p className="text-lg font-bold text-white">{strongest.name}</p>
          <p className="text-sm text-green-400 font-medium">{Math.round(strongest.avgPct)}% Avg</p>
        </div>

        {/* Needs Improvement */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:bg-slate-800 hover:border-yellow-500/50 transition-all group shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Needs Work</h4>
          </div>
          <p className="text-lg font-bold text-white">{weakest.name}</p>
          <p className="text-sm text-yellow-400 font-medium">{Math.round(weakest.avgPct)}% Avg</p>
        </div>

        {/* Most Improved */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:bg-slate-800 hover:border-blue-500/50 transition-all group shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Improved</h4>
          </div>
          <p className="text-lg font-bold text-white">{mostImproved.name}</p>
          <p className="text-sm text-blue-400 font-medium">
            {mostImproved.improvement > 0 ? '+' : ''}{Math.round(mostImproved.improvement)}% Change
          </p>
        </div>

        {/* Focus Area */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:bg-slate-800 transition-all group shadow-[0_0_15px_rgba(139,92,246,0.05)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-400">Focus Area</h4>
          </div>
          <p className="text-lg font-bold text-white">{weakest.name} Concepts</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">Try focusing on basic {weakest.name.toLowerCase()} topics.</p>
        </div>

      </div>
    </div>
  )
}
