'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle2, Clock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'

interface Props {
  studentId: string
  standard: string
  date: string // YYYY-MM-DD
}

type SessionState = {
  active: boolean
  mainActive: boolean
  lateActive: boolean
  expiresAt: number | null
  lateExpiresAt: number | null
  alreadyMarked: boolean
  requiresGps?: boolean
}

function useCountdown(targetMs: number | null): string {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    if (!targetMs) { setDisplay(''); return }
    const tick = () => {
      const diff = targetMs - Date.now()
      if (diff <= 0) { setDisplay('00:00'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setDisplay(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])
  return display
}

const STORAGE_KEY_PREFIX = 'att_marked_'

export default function AttendanceMark({ studentId, standard, date }: Props) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marked, setMarked] = useState<'present' | 'late' | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const storageKey = `${STORAGE_KEY_PREFIX}${studentId}_${date}`

  // Check localStorage for already-marked status
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored === 'present' || stored === 'late') {
      setMarked(stored)
    }
  }, [storageKey])

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/attendance/session?standard=${encodeURIComponent(standard)}&date=${date}`,
        { cache: 'no-store' }
      )
      if (!res.ok) return
      const data = await res.json()
      setSession(data)
      // If server says already marked, update local state too
      if (data.alreadyMarked && !marked) {
        const stored = localStorage.getItem(storageKey)
        if (stored === 'present' || stored === 'late') setMarked(stored)
      }
    } catch {
      // network error — stay silent
    }
  }, [standard, date, marked, storageKey])

  // Poll every 10 seconds
  useEffect(() => {
    if (marked) return // already done, no need to poll
    fetchSession()
    pollRef.current = setInterval(fetchSession, 10000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchSession, marked])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setSubmitting(true)
    setError(null)
    
    let lat: number | undefined
    let lon: number | undefined

    try {
      if (session?.requiresGps) {
        if (!('geolocation' in navigator)) {
          throw new Error('Your device does not support GPS location, which is required for attendance.')
        }
        
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            })
          })
          lat = pos.coords.latitude
          lon = pos.coords.longitude
        } catch (geoErr: any) {
          if (geoErr.code === 1) throw new Error('Please allow location access to mark attendance.')
          if (geoErr.code === 2) throw new Error('Location unavailable. Please ensure GPS is enabled.')
          if (geoErr.code === 3) throw new Error('Location request timed out. Try again.')
          throw new Error('Failed to get location. Please allow location access.')
        }
      }

      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), date, standard, lat, lon }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        const status: 'present' | 'late' = data.status
        setMarked(status)
        localStorage.setItem(storageKey, status)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch (err: any) {
      setError(err.message ?? 'Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const mainCountdown = useCountdown(session?.mainActive ? session.expiresAt : null)
  const lateCountdown = useCountdown(session?.lateActive ? session.lateExpiresAt : null)

  // ── Already marked ────────────────────────────────────────────────────────
  if (marked) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-green-500/30 bg-green-500/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-green-400">
              Attendance Marked {marked === 'late' ? '(Late)' : '✓'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {marked === 'late'
                ? "You've been marked as late for today's class."
                : "You're marked as present for today's class. See you!"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── No active session ─────────────────────────────────────────────────────
  if (!session?.active) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-[var(--border)]">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <h2 className="font-semibold text-sm">Mark Attendance</h2>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          No active attendance session right now. When your teacher starts one, a code
          entry box will appear here automatically.
        </p>
      </div>
    )
  }

  // ── Active session ────────────────────────────────────────────────────────
  const activeLate = session.lateActive && !session.mainActive

  return (
    <div
      className={`rounded-2xl p-6 border ${
        activeLate
          ? 'border-orange-500/40 bg-orange-500/5 shadow-lg shadow-orange-500/10'
          : 'border-[var(--primary)]/40 bg-[var(--primary)]/5 shadow-lg shadow-[var(--primary)]/10'
      }`}
      style={{ animation: 'pulse-border 2s ease-in-out infinite' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              activeLate ? 'bg-orange-500/15' : 'bg-[var(--primary)]/15'
            }`}
          >
            <CheckCircle2
              className={`w-5 h-5 ${activeLate ? 'text-orange-400' : 'text-[var(--primary)]'}`}
            />
          </div>
          <div>
            <p className="font-bold text-sm">
              {activeLate ? '🕐 Late Check-in Open!' : '📋 Attendance Session Active!'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Enter the code shown by your teacher
            </p>
            {session.requiresGps && (
              <p className="text-[10px] text-yellow-400 mt-1">
                📍 GPS location is required for this session
              </p>
            )}
          </div>
        </div>
        {/* Countdown */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
            activeLate
              ? 'bg-orange-500/10 text-orange-400'
              : 'bg-[var(--primary)]/10 text-[var(--primary)]'
          }`}
        >
          <Clock className="w-4 h-4" />
          {activeLate ? lateCountdown : mainCountdown}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="Enter 6-digit code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={`w-full px-4 py-3 rounded-xl bg-black/20 border text-center text-2xl font-mono font-bold tracking-[0.4em] placeholder:text-[var(--muted-foreground)] placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 transition-all ${
            activeLate
              ? 'border-orange-500/30 focus:ring-orange-500/40'
              : 'border-[var(--primary)]/30 focus:ring-[var(--primary)]/40'
          }`}
        />
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || code.length < 6}
          className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeLate
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-[var(--primary)] hover:opacity-90'
          }`}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> Mark My Attendance</>
          )}
        </button>
      </form>
    </div>
  )
}
