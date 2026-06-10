'use client'

import { useState, Fragment } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export interface EnhancedScore {
  id: string
  test_name: string
  test_type: string
  test_date: string
  total: number
  max_marks: number
  is_absent: boolean
  rank: number | null
  total_percentile: string | number
  subjects: {
    name: string
    score: number
    max_marks: number
    percentage: number
    percentile: string | number
    barColor: string
  }[]
}

export default function RecentTestsTable({ scores }: { scores: EnhancedScore[] }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-white/50 uppercase bg-white/[0.02] border-b border-white/5">
          <tr>
            <th className="px-6 py-4 font-semibold">Test Name</th>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold text-center">Score</th>
            <th className="px-6 py-4 font-semibold text-center">PR</th>
            <th className="px-6 py-4 font-semibold text-center">Rank</th>
            <th className="px-6 py-4 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {scores.map((score) => (
            <Fragment key={score.id}>
              <tr 
                onClick={() => setExpandedRow(expandedRow === score.id ? null : score.id)}
                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {expandedRow === score.id ? (
                      <ChevronUp className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    )}
                    <div>
                      <p className="font-medium text-white/90">{score.test_name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">{score.test_type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/60 whitespace-nowrap">
                  {score.test_date ? new Date(score.test_date).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-center font-medium">
                  {score.is_absent ? '-' : `${score.total} / ${score.max_marks}`}
                </td>
                <td className="px-6 py-4 text-center">
                  {score.is_absent ? '-' : `${score.total_percentile} PR`}
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
              
              {/* Expanded Row Content */}
              {expandedRow === score.id && (
                <tr className="bg-black/20">
                  <td colSpan={6} className="p-0 border-t border-white/5">
                    <div className="p-6 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Subject Breakdown</h4>
                      
                      {score.is_absent ? (
                        <div className="text-sm text-white/40 italic flex items-center justify-center py-4">
                          Absent for this test
                        </div>
                      ) : score.subjects.length === 0 ? (
                        <div className="text-sm text-white/40 italic flex items-center justify-center py-4">
                          No subject data available
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {score.subjects.map((sub) => (
                            <div key={sub.name} className="bg-white/5 border border-white/10 rounded-xl p-4">
                              <div className="flex justify-between items-end mb-3">
                                <span className="text-sm font-medium capitalize text-white/90">{sub.name}</span>
                                <div className="text-right flex flex-col items-end gap-1">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold text-white/90">{sub.score}</span>
                                    {sub.max_marks > 0 && (
                                      <span className="text-xs text-white/30 font-normal">/ {sub.max_marks}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/50">({sub.percentage}%)</span>
                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                                      {sub.percentile} PR
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${sub.barColor} rounded-full transition-all duration-1000 ease-out`}
                                  style={{ width: `${sub.percentage}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
          {scores.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-white/40">
                No recent tests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
