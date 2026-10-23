'use client'

import { useState, Fragment } from 'react'
import { ChevronDown, ChevronUp, FileSpreadsheet, Calendar, Award, Target, CheckCircle2, XCircle } from 'lucide-react'

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

  const toggleRow = (id: string) => {
    setExpandedRow(prev => (prev === id ? null : id))
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
          <FileSpreadsheet className="w-6 h-6 text-slate-500" />
        </div>
        <p className="text-white font-medium text-sm">No test records available</p>
        <p className="text-slate-400 text-xs mt-1">Scores uploaded by the faculty will appear here.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* ── DESKTOP & TABLET VIEW (TABLE) ─────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-slate-900/50 border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5 font-semibold">Test Name</th>
              <th className="px-6 py-3.5 font-semibold">Date</th>
              <th className="px-6 py-3.5 font-semibold text-center">Score</th>
              <th className="px-6 py-3.5 font-semibold text-center">Percentile</th>
              <th className="px-6 py-3.5 font-semibold text-center">Rank</th>
              <th className="px-6 py-3.5 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {scores.map((score) => {
              const isExpanded = expandedRow === score.id

              return (
                <Fragment key={score.id}>
                  <tr
                    onClick={() => toggleRow(score.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-md bg-slate-800 text-slate-400 group-hover:text-white transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white tracking-tight">{score.test_name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                            {score.test_type}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-xs whitespace-nowrap">
                      {score.test_date ? new Date(score.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-white">
                      {score.is_absent ? (
                        <span className="text-slate-500 font-normal">-</span>
                      ) : (
                        <span>{score.total} <span className="text-slate-400 text-xs font-normal">/ {score.max_marks}</span></span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {score.is_absent ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold border border-pink-500/20">
                          {score.total_percentile} PR
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {score.is_absent || !score.rank ? (
                        <span className="text-slate-500">-</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                          #{score.rank}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {score.is_absent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Desktop Expanded Accordion */}
                  {isExpanded && (
                    <tr className="bg-slate-900/60">
                      <td colSpan={6} className="p-0 border-t border-slate-800">
                        <div className="p-6">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-400" /> Subject-wise Performance Breakdown
                          </h4>

                          {score.is_absent ? (
                            <div className="text-sm text-slate-400 italic py-2">
                              Student was marked absent for this test.
                            </div>
                          ) : score.subjects.length === 0 ? (
                            <div className="text-sm text-slate-400 italic py-2">
                              No subject breakdown recorded for this test.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {score.subjects.map((sub) => (
                                <div key={sub.name} className="bg-[#111827] border border-slate-700/80 rounded-2xl p-4 shadow-sm">
                                  <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-semibold capitalize text-white">{sub.name}</span>
                                    <div className="text-right">
                                      <span className="text-sm font-bold text-white">{sub.score}</span>
                                      {sub.max_marks > 0 && (
                                        <span className="text-xs text-slate-400 font-normal"> / {sub.max_marks}</span>
                                      )}
                                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">({sub.percentage}%)</span>
                                    </div>
                                  </div>
                                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                                    <div
                                      className={`h-full bg-gradient-to-r ${sub.barColor} rounded-full transition-all duration-700 ease-out`}
                                      style={{ width: `${sub.percentage}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span>Percentile</span>
                                    <span className="font-semibold text-blue-400">{sub.percentile} PR</span>
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
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARD VIEW (< 640px) ────────────────────────────────────── */}
      <div className="block sm:hidden divide-y divide-slate-800/80">
        {scores.map((score) => {
          const isExpanded = expandedRow === score.id

          return (
            <div key={score.id} className="p-4 space-y-3">
              {/* Card Header */}
              <div
                onClick={() => toggleRow(score.id)}
                className="flex items-start justify-between gap-2 cursor-pointer"
              >
                <div>
                  <h3 className="font-bold text-white text-sm">{score.test_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {score.test_type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {score.test_date ? new Date(score.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {score.is_absent ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20">
                      Absent
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                      Present
                    </span>
                  )}
                  <div className="p-1 rounded-md bg-slate-800 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Mobile Quick Stats */}
              {!score.is_absent && (
                <div
                  onClick={() => toggleRow(score.id)}
                  className="grid grid-cols-3 gap-2 pt-1 cursor-pointer"
                >
                  <div className="bg-slate-800/60 p-2 rounded-xl text-center border border-slate-700/50">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Score</p>
                    <p className="text-xs font-bold text-white mt-0.5">
                      {score.total} <span className="text-[10px] text-slate-400 font-normal">/ {score.max_marks}</span>
                    </p>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl text-center border border-slate-700/50">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Rank</p>
                    <p className="text-xs font-bold text-purple-400 mt-0.5">
                      {score.rank ? `#${score.rank}` : '-'}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded-xl text-center border border-slate-700/50">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Percentile</p>
                    <p className="text-xs font-bold text-pink-400 mt-0.5">
                      {score.total_percentile} PR
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile Expanded Subject Breakdown */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Subject Details
                  </h4>
                  {score.is_absent ? (
                    <p className="text-xs text-slate-400 italic">Absent for this test</p>
                  ) : score.subjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No subject data recorded</p>
                  ) : (
                    <div className="space-y-2.5">
                      {score.subjects.map((sub) => (
                        <div key={sub.name} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-semibold text-white capitalize">{sub.name}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{sub.score}/{sub.max_marks}</span>
                              <span className="text-[10px] text-slate-400">({sub.percentage}%)</span>
                              <span className="text-[10px] font-medium px-1 py-0.2 rounded bg-blue-500/10 text-blue-400">
                                {sub.percentile} PR
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${sub.barColor} rounded-full`}
                              style={{ width: `${sub.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
