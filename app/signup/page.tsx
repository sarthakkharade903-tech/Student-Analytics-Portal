'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignupFormData } from '@/lib/types'
import { BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  // Prevents duplicate router.replace() calls
  const redirectingRef = useRef(false)
  const [formData, setFormData] = useState<SignupFormData>({
    coachingName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Helper to extract message from any error type (Error or Supabase PostgrestError)
    const getErrorMessage = (err: unknown): string => {
      if (!err) return 'Unknown error'
      if (err instanceof Error) return err.message
      if (typeof err === 'object') {
        const e = err as Record<string, unknown>
        if (typeof e.message === 'string') return e.message
        if (typeof e.details === 'string') return e.details
        if (typeof e.error_description === 'string') return e.error_description
        return JSON.stringify(err)
      }
      return String(err)
    }

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.ownerName },
        },
      })

      if (authError) {
        throw new Error('[Auth] ' + getErrorMessage(authError))
      }
      if (!authData.user) {
        throw new Error('Could not create auth account. Please try again.')
      }

      const userId = authData.user.id

      // Step 2: Create coaching center record
      const { data: centerData, error: centerError } = await supabase
        .from('coaching_centers')
        .insert({
          name: formData.coachingName,
          phone: formData.phone,
          email: formData.email,
        })
        .select('id')
        .single()

      if (centerError) {
        throw new Error('[DB coaching_centers] ' + getErrorMessage(centerError))
      }

      // Step 3: Create user profile record
      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        coaching_center_id: centerData.id,
        name: formData.ownerName,
        email: formData.email,
        role: 'owner',
      })

      if (userError) {
        throw new Error('[DB users] ' + getErrorMessage(userError))
      }

      setSuccess(true)
      setTimeout(() => {
        if (!redirectingRef.current) {
          redirectingRef.current = true
          // Use replace() so users cannot navigate "back" to the signup page.
          // Do NOT call router.refresh() — it triggers a middleware re-evaluation
          // of the current /signup path while navigation is in flight, causing
          // a redirect race that produces the flickering symptom.
          router.replace('/dashboard')
        }
      }, 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Signup error:', message, err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[oklch(0.62_0.22_265/0.06)] rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">Parent Analytics Portal</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-2">
            Set up your coaching institute in under 2 minutes
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card rounded-2xl p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Account created!</h3>
              <p className="text-[var(--muted-foreground)] text-sm">Redirecting to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Coaching Name */}
              <div className="space-y-1.5">
                <label htmlFor="coachingName" className="text-sm font-medium text-[var(--foreground)]">
                  Coaching Institute Name
                </label>
                <input
                  id="coachingName"
                  name="coachingName"
                  type="text"
                  required
                  placeholder="e.g. Apex Academy"
                  value={formData.coachingName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
                />
              </div>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <label htmlFor="ownerName" className="text-sm font-medium">Owner Name</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pr-11 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm glow-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
