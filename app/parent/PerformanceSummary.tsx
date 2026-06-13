'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

interface PerformanceSummaryProps {
  studentId: string
}

export default function PerformanceSummary({ studentId }: PerformanceSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSummary = async (bust = false) => {
    try {
      bust ? setRefreshing(true) : setLoading(true)
      setErrorMsg(null)

      const url = `/api/ai/insights?student_id=${studentId}${bust ? '&bust=1' : ''}`
      const res = await fetch(url, { cache: bust ? 'no-store' : 'default' })
      const data = await res.json()

      if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`
        console.error('[PerformanceSummary] API error:', msg)
        setErrorMsg(msg)
        return
      }

      setSummary(data.summary)
      setFromCache(data.cached)
    } catch (e: any) {
      const msg = e?.message || 'Network error'
      console.error('[PerformanceSummary] Fetch failed:', msg)
      setErrorMsg(msg)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId])

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#1a2540] shadow-sm">
      {/* Animated gradient glow border */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none">
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
        <div className="absolute top-0 left-0 w-40 h-40 bg-violet-600/10 rounded-full blur-[60px]" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[60px]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-white">Performance Summary</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              AI-generated insight
            </p>
          </div>
        </div>

        {!loading && !errorMsg && (
          <button
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            title="Refresh summary"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-40 group"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative px-6 pb-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-700 rounded-full w-full" />
            <div className="h-4 bg-slate-700 rounded-full w-[90%]" />
            <div className="h-4 bg-slate-700 rounded-full w-[75%]" />
            <p className="text-xs text-slate-500 text-center pt-2">Analysing performance data…</p>
          </div>
        ) : errorMsg ? (
          <div className="text-sm text-slate-400 italic text-center py-4 space-y-1">
            <p className="text-red-400 text-xs font-mono bg-red-500/10 rounded-lg px-3 py-2 text-left break-all">{errorMsg}</p>
            <button onClick={() => fetchSummary(true)} className="text-violet-400 hover:underline text-xs">
              Retry
            </button>
          </div>
        ) : summary ? (
          <div className="space-y-2">
            <p className="text-sm text-white leading-relaxed tracking-wide">
              {summary}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${fromCache ? 'bg-green-500' : 'bg-violet-500 animate-pulse'}`} />
              <span className="text-[10px] text-slate-400">
                {fromCache ? 'Loaded from cache · refreshes daily' : 'Just generated'}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
