'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Lock, ShieldAlert, Loader2 } from 'lucide-react'

// Map route prefixes to feature keys
const ROUTE_TO_FEATURE: Record<string, string> = {
  '/dashboard/students': 'students',
  '/dashboard/fee-management': 'fee_management',
  '/dashboard/tests': 'tests',
  '/dashboard/attendance': 'attendance',
  '/dashboard/resources': 'resources',
  '/dashboard/analytics': 'analytics',
}

function getFeatureKeyForPath(pathname: string): string | null {
  for (const [route, key] of Object.entries(ROUTE_TO_FEATURE)) {
    if (pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route + '?')) {
      return key
    }
  }
  return null
}

interface ProtectedFeatureProps {
  children: React.ReactNode
  lockedModules: Record<string, boolean>
}

export function ProtectedFeature({ children, lockedModules }: ProtectedFeatureProps) {
  const router = useRouter()
  const pathname = usePathname()
  const currentFeatureKey = getFeatureKeyForPath(pathname)

  // Session cache: once unlocked in this tab session, stays unlocked per feature
  const [unlockedInSession, setUnlockedInSession] = useState<Record<string, boolean>>({})

  const [enteredPin, setEnteredPin] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Determine lock status based on boolean props passed from the server
  const isLocked = currentFeatureKey ? lockedModules[currentFeatureKey] === true : false
  const isUnlockedThisSession = currentFeatureKey ? unlockedInSession[currentFeatureKey] === true : false
  const showProtection = isLocked && !isUnlockedThisSession

  useEffect(() => {
    // We clear errors when path changes
    setError('')
    setEnteredPin('')
  }, [pathname])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFeatureKey) return

    setIsVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/coaching/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey: currentFeatureKey, pin: enteredPin }),
      })

      const data = await res.json()

      if (data.success) {
        setUnlockedInSession(prev => ({ ...prev, [currentFeatureKey]: true }))
        setEnteredPin('')
        router.refresh() // Tell Next.js to re-fetch Server Components (which will read the new cookie)
      } else {
        setError(data.message || 'Incorrect PIN')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Normal render if not protected
  if (!showProtection) {
    return <>{children}</>
  }

  // Locked — show PIN wall
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Protected Feature</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This feature is locked. Enter the 4-digit PIN to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                4-Digit PIN
              </label>
              <input
                id="protected-feature-pin"
                type="text" // using text so we can style it or restrict length easily
                maxLength={4}
                value={enteredPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '') // only digits
                  setEnteredPin(val)
                  setError('')
                }}
                placeholder="0000"
                className="w-full px-4 py-3 text-center tracking-widest text-xl rounded-xl border border-gray-300 focus:border-slate-700 focus:ring-2 focus:ring-slate-200 outline-none transition-all font-mono"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 font-semibold">{error}</p>
              </div>
            )}

            <button
              id="protected-feature-submit"
              type="submit"
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={enteredPin.length !== 4 || isVerifying}
            >
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {isVerifying ? 'Verifying...' : 'Unlock Feature'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
