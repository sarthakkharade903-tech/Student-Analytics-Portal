'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Phone, Hash, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function PortalLoginPage() {
  const router = useRouter()
  const [rollNo, setRollNo] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_no: rollNo, parent_phone: parentPhone }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please check your details.')
        setLoading(false)
        return
      }

      router.push('/portal/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[oklch(0.62_0.22_265/0.07)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[oklch(0.65_0.18_300/0.05)] blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[oklch(0.62_0.22_265/0.15)] border border-[oklch(0.62_0.22_265/0.3)] mb-5 shadow-lg">
            <GraduationCap className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Student <span className="gradient-text">Portal</span>
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm">
            View your test results and performance instantly.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Roll Number */}
            <div className="space-y-2">
              <label htmlFor="roll_no" className="text-sm font-medium text-[var(--foreground)]">
                Roll Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  id="roll_no"
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 1, 42, 101"
                  required
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Parent Phone */}
            <div className="space-y-2">
              <label htmlFor="parent_phone" className="text-sm font-medium text-[var(--foreground)]">
                Parent&apos;s Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  id="parent_phone"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  required
                  autoComplete="tel"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="portal-login-btn"
              type="submit"
              disabled={loading || !rollNo || !parentPhone}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all glow-primary text-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : (
                <>View My Results <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Hint */}
          <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            Use the roll number and parent phone number<br />registered with your coaching center.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--muted-foreground)] mt-6 opacity-60">
          Parent Analytics Portal · For students &amp; parents only
        </p>
      </div>
    </div>
  )
}
