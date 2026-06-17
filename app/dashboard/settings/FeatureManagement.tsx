'use client'

import { useState, useTransition } from 'react'
import {
  Users,
  Banknote,
  ClipboardList,
  CalendarCheck,
  BookOpen,
  TrendingUp,
  EyeOff,
  Eye,
  Layers,
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
    activeShadow: 'shadow-blue-100',
  },
  {
    key: 'fee_management',
    label: 'Fee Management',
    description: 'Track fee payments, generate receipts, and view dues.',
    icon: Banknote,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    activeShadow: 'shadow-emerald-100',
  },
  {
    key: 'tests',
    label: 'Tests',
    description: 'Upload test results, analyse scores, and rank students.',
    icon: ClipboardList,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    activeShadow: 'shadow-violet-100',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Record and monitor daily attendance across all batches.',
    icon: CalendarCheck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    activeShadow: 'shadow-orange-100',
  },
  {
    key: 'resources',
    label: 'Resources',
    description: 'Share study materials, notes, and documents with students.',
    icon: BookOpen,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    activeShadow: 'shadow-pink-100',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'View performance trends, batch comparisons, and insights.',
    icon: TrendingUp,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    activeShadow: 'shadow-indigo-100',
  },
]

interface FeatureManagementProps {
  initialFeatures: Record<string, boolean>
}

export function FeatureManagement({ initialFeatures }: FeatureManagementProps) {
  const defaultFeatures = {
    students: true,
    fee_management: true,
    tests: true,
    attendance: true,
    resources: true,
    analytics: true,
  }

  const [features, setFeatures] = useState<Record<string, boolean>>({
    ...defaultFeatures,
    ...initialFeatures,
  })

  const [saving, setSaving] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleToggle = async (key: string) => {
    const newValue = !features[key]
    const updatedFeatures = { ...features, [key]: newValue }

    setFeatures(updatedFeatures) // Optimistic update
    setSaving(key)

    try {
      const res = await fetch('/api/coaching/features/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: updatedFeatures }),
      })

      const data = await res.json()

      if (!data.success) {
        // Revert on failure
        setFeatures(features)
        alert('Failed to save: ' + data.message)
      } else {
        setSavedKey(key)
        setTimeout(() => setSavedKey(null), 2000)
      }
    } catch {
      setFeatures(features) // Revert on error
    } finally {
      setSaving(null)
    }
  }

  const enabledCount = Object.values(features).filter(Boolean).length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 flex items-center gap-3 border-b border-gray-100">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-slate-700 to-slate-900">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">Feature Management</h2>
          <p className="text-xs text-gray-500">Show or hide modules from your sidebar. Changes apply only to your institute.</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {enabledCount} of {FEATURES.length} Active
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="p-6 grid gap-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          const isEnabled = features[feature.key] !== false
          const isSaving = saving === feature.key
          const justSaved = savedKey === feature.key

          return (
            <div
              key={feature.key}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                isEnabled
                  ? `bg-white border-gray-100 shadow-sm hover:border-gray-200`
                  : 'bg-gray-50 border-gray-100 opacity-75'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isEnabled ? `${feature.bg} ${feature.border} border` : 'bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isEnabled ? feature.color : 'text-gray-400'}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm font-semibold transition-colors duration-200 ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {feature.label}
                  </span>
                  {justSaved && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full animate-in fade-in duration-200">
                      Saved ✓
                    </span>
                  )}
                </div>
                <p className={`text-xs transition-colors duration-200 ${isEnabled ? 'text-gray-500' : 'text-gray-400'}`}>
                  {feature.description}
                </p>
              </div>

              {/* Visibility indicator */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {isEnabled ? (
                  <Eye className="w-3.5 h-3.5 text-gray-300" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                )}

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(feature.key)}
                  disabled={isSaving}
                  aria-label={`Toggle ${feature.label}`}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-wait ${
                    isEnabled
                      ? 'bg-blue-600 shadow-md shadow-blue-200'
                      : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-6 pb-5">
        <p className="text-[11px] text-gray-400 text-center">
          Hidden modules disappear from the sidebar automatically. You can re-enable them at any time.
        </p>
      </div>
    </div>
  )
}
