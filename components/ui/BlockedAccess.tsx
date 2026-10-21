'use client'
import { ShieldAlert, Clock, Phone, Mail, LogOut, Key, Loader2, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

export default function BlockedAccess({
  message = 'Platform Access Suspended',
  isTrialExpired = false,
  showLogout = false,
}: {
  message?: string
  isTrialExpired?: boolean
  showLogout?: boolean
}) {
  const [securityKey, setSecurityKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showRenew, setShowRenew] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/parent/logout', { method: 'POST' }).catch(() => {})
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/login'
  }

  const handleSwitchAccount = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/login'
  }

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!securityKey.trim()) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/coaching/renew-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: securityKey.trim() })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setSuccess(true)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setError(data.error || 'Failed to renew plan. Please check the key.')
      }
    } catch (err) {
      setError('Network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-2xl p-8 shadow-xl text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${
          isTrialExpired
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          {isTrialExpired
            ? <Clock className="w-8 h-8 text-amber-500" />
            : <ShieldAlert className="w-8 h-8 text-red-500" />
          }
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {isTrialExpired ? 'Trial Expired' : 'Access Denied'}
        </h1>

        <p className="text-[var(--muted-foreground)] mb-6">{message}</p>

        {showRenew ? (
          <form onSubmit={handleRenew} className="space-y-4 mb-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider mb-2">
                Enter Security Key
              </label>
              <input
                type="text"
                value={securityKey}
                onChange={e => setSecurityKey(e.target.value)}
                placeholder="e.g. X7K9M2P4"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-[var(--foreground)] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                required
              />
            </div>
            
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            {success && (
              <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Plan renewed successfully! Reloading...
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRenew(false)}
                className="flex-1 py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] font-medium transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !securityKey.trim()}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Activate Plan
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Contact us to upgrade to a full plan:
            </p>
            <a
              href="tel:+919999999999"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </a>
            
            <button
              onClick={() => setShowRenew(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 font-bold transition-all"
            >
              <Key className="w-4 h-4" />
              I have a Security Key to Renew
            </button>
          </div>
        )}

        {/* Switch account — always shown */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-col gap-2">
          <button
            onClick={handleSwitchAccount}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 font-semibold text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign In with a Different Account
          </button>

          {showLogout && (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors mt-1"
            >
              Sign out & Clear Session
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
