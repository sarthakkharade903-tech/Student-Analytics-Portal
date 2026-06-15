'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignupFormData } from '@/lib/types'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

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
  const [inviteCode, setInviteCode] = useState('')
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

    try {
      // All logic (invite code check + DB writes) happens securely on the server
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachingName: formData.coachingName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          inviteCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed. Please try again.')
      }

      // Account fully created — now sign in on the client so the session cookie is set
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      if (signInError) {
        throw new Error('Account created but could not log in automatically. Please log in manually.')
      }

      setSuccess(true)
      setTimeout(() => {
        if (!redirectingRef.current) {
          redirectingRef.current = true
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
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Left Panel - Branding & Marketing */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#3b0764] flex-col justify-between p-12 overflow-hidden text-white">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/30 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px]"></div>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
            <span className="font-black text-xl text-white tracking-tighter">SA</span>
          </div>
          <span className="font-bold text-xl tracking-tight">StudentAnalytics</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center mt-12">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
            <span className="text-4xl">🏫</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Manage Your Institute</h1>
          <p className="text-purple-200 text-base max-w-sm mb-12 leading-relaxed">
            Create tests, track every student, and send results to parents in one click.
          </p>

          <div className="w-full max-w-sm space-y-4">
            {/* Stat Card 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center text-2xl">
                👨‍🎓
              </div>
              <div>
                <div className="font-bold text-xl">320+</div>
                <div className="text-purple-200 text-xs font-medium">Students Managed</div>
              </div>
            </div>
            {/* Stat Card 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center text-2xl">
                🧪
              </div>
              <div>
                <div className="font-bold text-xl">45</div>
                <div className="text-purple-200 text-xs font-medium">Tests This Month</div>
              </div>
            </div>
            {/* Stat Card 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center text-2xl">
                📲
              </div>
              <div>
                <div className="font-bold text-xl">280</div>
                <div className="text-purple-200 text-xs font-medium">Parent Alerts Sent</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center mt-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300/60">
            Trusted by institutes across India
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 my-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#5b21b6]">Admin Signup</h2>
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Account created!</h3>
              <p className="text-slate-500 text-sm">Redirecting to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Coaching Name */}
              <div className="space-y-1.5">
                <label htmlFor="coachingName" className="text-sm font-semibold text-slate-700">
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
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                />
              </div>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <label htmlFor="ownerName" className="text-sm font-semibold text-slate-700">Owner Name</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
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
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Invite Code */}
              <div className="space-y-1.5">
                <label htmlFor="inviteCode" className="text-sm font-semibold text-slate-700">
                  Invite Code
                </label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="password"
                  required
                  placeholder="Enter your invite code"
                  value={inviteCode}
                  onChange={(e) => { setInviteCode(e.target.value); setError(null) }}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                />
                <p className="text-xs text-slate-400">Contact the administrator to get your invite code.</p>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6d28d9] to-[#5b21b6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2"
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

          {/* Login link */}
          <div className="mt-6 flex justify-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-[#5b21b6] hover:underline font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
