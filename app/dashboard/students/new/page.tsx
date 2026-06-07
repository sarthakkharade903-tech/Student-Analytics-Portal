'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

interface FormData {
  name: string
  roll_no: string
  parent_phone: string
  batch: string
}

export default function AddStudentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    roll_no: '',
    parent_phone: '',
    batch: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [coachingCenterId, setCoachingCenterId] = useState<string | null>(null)

  // Fetch coaching_center_id on mount
  useEffect(() => {
    const fetchCenterData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('coaching_center_id')
        .eq('id', user.id)
        .single()

      if (profile?.coaching_center_id) {
        setCoachingCenterId(profile.coaching_center_id)
      }
    }
    fetchCenterData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coachingCenterId) {
      setError('Could not load institute data. Please refresh and try again.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: insertError } = await supabase.from('students').insert({
      coaching_center_id: coachingCenterId,
      name: formData.name.trim(),
      roll_no: formData.roll_no.trim(),
      parent_phone: formData.parent_phone.trim(),
      batch: formData.batch.trim(),
    })

    if (insertError) {
      const msg =
        typeof insertError === 'object' && 'message' in insertError
          ? insertError.message
          : 'Failed to add student. Please try again.'
      setError(msg)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard/students')
      router.refresh()
    }, 1200)
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add Student</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Add a new student to your coaching institute.
        </p>
      </div>

      {/* Form card */}
      <div className="glass-card rounded-2xl p-8">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Student added!</h3>
            <p className="text-[var(--muted-foreground)] text-sm">Redirecting to student list…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Student Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Student Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
              />
            </div>

            {/* Roll Number */}
            <div className="space-y-1.5">
              <label htmlFor="roll_no" className="text-sm font-medium">
                Roll Number <span className="text-red-400">*</span>
              </label>
              <input
                id="roll_no"
                name="roll_no"
                type="text"
                required
                placeholder="e.g. 2024101"
                value={formData.roll_no}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
              />
            </div>

            {/* Two column: Batch + Parent Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="batch" className="text-sm font-medium">
                  Batch
                </label>
                <input
                  id="batch"
                  name="batch"
                  type="text"
                  placeholder="e.g. JEE 2026"
                  value={formData.batch}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="parent_phone" className="text-sm font-medium">
                  Parent Phone
                </label>
                <input
                  id="parent_phone"
                  name="parent_phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard/students"
                className="flex-1 py-2.5 px-4 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all text-center"
              >
                Cancel
              </Link>
              <button
                id="add-student-submit"
                type="submit"
                disabled={loading || !coachingCenterId}
                className="flex-1 py-2.5 px-4 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 glow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  'Add Student'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
