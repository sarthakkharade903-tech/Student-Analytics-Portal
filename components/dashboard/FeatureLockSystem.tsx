'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Banknote,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  TrendingUp,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Pencil,
} from 'lucide-react'

const FEATURES = [
  {
    key: 'students',
    label: 'Students',
    description: 'Manage student records, profiles, and batch assignments.',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    key: 'fee_management',
    label: 'Fee Management',
    description: 'Track fee payments, generate receipts, and view dues.',
    icon: Banknote,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    key: 'tests',
    label: 'Tests',
    description: 'Upload test results, analyse scores, and rank students.',
    icon: ClipboardList,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Record and monitor daily attendance across all batches.',
    icon: CalendarCheck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    key: 'resources',
    label: 'Resources',
    description: 'Share study materials, notes, and documents with students.',
    icon: BookOpen,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'View performance trends, batch comparisons, and insights.',
    icon: TrendingUp,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
]

interface FeatureLockSystemProps {
  initialFeatures: any
}

// Generate a random 4-digit PIN
function generatePIN() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export function FeatureLockSystem({ initialFeatures }: FeatureLockSystemProps) {
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  // features.locked_modules stores the lock state as PIN strings
  const defaultLocked = {}
  const [lockedModules, setLockedModules] = useState<Record<string, string | false>>({
    ...defaultLocked,
    ...(initialFeatures?.locked_modules || {}),
  })

  // To track PIN edits before they are saved
  const [pinEdits, setPinEdits] = useState<Record<string, string>>({})

  const [saving, setSaving] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setError('')

    try {
      const res = await fetch('/api/coaching/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (data.success) {
        setIsVerified(true)
        setShowDialog(false)
        setPassword('')
      } else {
        setError(data.message || 'Incorrect Password')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const saveLocksToDB = async (newLockedModules: Record<string, string | false>, keySaving: string) => {
    setSaving(keySaving)

    // Build the full features object to save, keeping existing visibility states
    const updatedFeatures = {
      ...initialFeatures,
      locked_modules: newLockedModules,
    }

    try {
      const res = await fetch('/api/coaching/features/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: updatedFeatures }),
      })

      const data = await res.json()

      if (!data.success) {
        // revert on failure
        setLockedModules(lockedModules)
        alert('Failed to save: ' + data.message)
      } else {
        setLockedModules(newLockedModules)
        setSavedKey(keySaving)
        setTimeout(() => setSavedKey(null), 2000)
        // Refresh router to update layout.tsx server component immediately
        router.refresh()
      }
    } catch {
      setLockedModules(lockedModules) // revert on error
      alert('Network error occurred while saving.')
    } finally {
      setSaving(null)
    }
  }

  const handleToggle = (key: string) => {
    const isCurrentlyLocked = !!lockedModules[key]
    const newLockedModules = { ...lockedModules }

    if (isCurrentlyLocked) {
      newLockedModules[key] = false // Unlock
      setPinEdits((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    } else {
      newLockedModules[key] = generatePIN() // Lock with new PIN
    }

    saveLocksToDB(newLockedModules, key)
  }

  const handlePinEditChange = (key: string, value: string) => {
    // Only allow 4 digits
    if (/^\d{0,4}$/.test(value)) {
      setPinEdits(prev => ({ ...prev, [key]: value }))
    }
  }

  const handlePinEditSave = (key: string) => {
    const newPin = pinEdits[key]
    if (!newPin || newPin.length !== 4) {
      alert("PIN must be exactly 4 digits.")
      return
    }

    const newLockedModules = { ...lockedModules, [key]: newPin }
    saveLocksToDB(newLockedModules, key)
    
    // Clear edit state
    setPinEdits((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handlePinEditCancel = (key: string) => {
    setPinEdits((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const generateNewPinForExisting = (key: string) => {
    const newLockedModules = { ...lockedModules, [key]: generatePIN() }
    saveLocksToDB(newLockedModules, key)
  }

  const lockedCount = Object.values(lockedModules).filter(Boolean).length

  // Main UI when verified
  if (isVerified) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
        <div className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-gray-100">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">Feature Lock System</h2>
            <p className="text-xs text-gray-500">Lock modules with unique 4-digit PINs. These PINs are required to access the protected features.</p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            {lockedCount} Locked
          </div>
        </div>

        <div className="p-6 grid gap-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            const pinValue = lockedModules[feature.key]
            const isLocked = !!pinValue
            const isSaving = saving === feature.key
            const justSaved = savedKey === feature.key
            const isEditing = pinEdits.hasOwnProperty(feature.key)
            const editedPin = pinEdits[feature.key] || ''

            return (
              <div
                key={feature.key}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-white border-gray-100 shadow-sm hover:border-gray-200 transition-all duration-300"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${feature.bg} ${feature.border}`}>
                    <Icon className={`w-4 h-4 ${feature.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {feature.label}
                      </span>
                      {justSaved && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full animate-in fade-in duration-200">
                          Saved ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{feature.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 sm:ml-auto">
                  {isLocked && (
                    <div className="flex items-center gap-2 mr-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editedPin}
                            onChange={(e) => handlePinEditChange(feature.key, e.target.value)}
                            className="w-16 px-2 py-1 text-center text-sm font-bold tracking-widest text-slate-700 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            placeholder="PIN"
                            autoFocus
                          />
                          <button
                            onClick={() => handlePinEditSave(feature.key)}
                            disabled={isSaving || editedPin.length !== 4}
                            className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1.5 rounded-md transition-colors disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handlePinEditCancel(feature.key)}
                            disabled={isSaving}
                            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <div 
                            onClick={() => setPinEdits({ ...pinEdits, [feature.key]: pinValue as string })}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm font-black tracking-widest text-red-700 cursor-pointer hover:bg-red-100 transition-colors tooltip-trigger relative group"
                            title="Click to edit PIN"
                          >
                            <span>{pinValue}</span>
                            <Pencil className="w-3.5 h-3.5 text-red-400 group-hover:text-red-600 transition-colors ml-1" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                              Click to edit
                            </div>
                          </div>
                          <button
                            onClick={() => generateNewPinForExisting(feature.key)}
                            disabled={isSaving}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="Generate new random PIN"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {!isEditing && (
                    <>
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-red-500" />
                      ) : (
                        <Unlock className="w-4 h-4 text-emerald-500" />
                      )}

                      <button
                        onClick={() => handleToggle(feature.key)}
                        disabled={isSaving}
                        aria-label={`Toggle lock for ${feature.label}`}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-wait ${
                          isLocked ? 'bg-red-500 shadow-md shadow-red-200' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                            isLocked ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-6 pb-5">
          <p className="text-[11px] text-gray-400 text-center">
            Toggle ON to lock a feature. A 4-digit PIN will be automatically generated. You can click the PIN to edit it.
          </p>
        </div>
      </div>
    )
  }

  // Initial UI or Dialog state
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
      <div className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-gray-100">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50 border border-red-100">
          <ShieldCheck className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">Feature Lock System</h2>
          <p className="text-xs text-gray-500">Protect sensitive modules using unique 4-digit PINs.</p>
        </div>
      </div>

      <div className="p-6">
        {!showDialog ? (
          <button
            onClick={() => setShowDialog(true)}
            className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Key className="w-4 h-4" />
            Manage Locked Features
          </button>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4 max-w-sm mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Enter Account Password</h3>
              <p className="text-xs text-gray-500">Enter your account password to manage locked features.</p>
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Account Password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                autoFocus
              />
              {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                disabled={verifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                disabled={verifying || !password}
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
