'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, Key, Building2, User, Mail, Phone, Lock } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const redirectingRef = useRef(false)

  const [step, setStep] = useState<'invite' | 'details'>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [prefilledName, setPrefilledName] = useState('')

  const [formData, setFormData] = useState({
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

  // Step 1: Verify invite code and auto-fill institute name
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setInviteLoading(true)
    setInviteError('')

    try {
      const res = await fetch('/api/auth/lookup-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      })
      const data = await res.json()

      if (!data.found) {
        setInviteError(data.error || 'Invalid invite code. Please check and try again.')
        return
      }

      // Pre-fill form with institute data if available
      if (data.institute) {
        setPrefilledName(data.institute.name || '')
        setFormData((prev) => ({
          ...prev,
          coachingName: data.institute.name || '',
          ownerName: data.institute.owner_name || '',
          email: data.institute.email || '',
          phone: data.institute.phone || '',
        }))
      }

      setStep('details')
    } catch {
      setInviteError('Could not verify code. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  // Step 2: Create account
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachingName: formData.coachingName,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed. Please try again.')
      }

      // Auto sign-in after account creation
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
      }, 1800)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#3b0764] flex-col justify-between p-12 overflow-hidden text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/30 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[80px]" />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
            <span className="font-black text-xl text-white tracking-tighter">SA</span>
          </div>
          <span className="font-bold text-xl tracking-tight">StudentAnalytics</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-8 shadow-2xl">
            <span className="text-4xl">🏫</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Manage Your Institute</h1>
          <p className="text-purple-200 text-base max-w-sm mb-12 leading-relaxed">
            Create tests, track every student, and send results to parents in one click.
          </p>
          <div className="w-full max-w-sm space-y-4">
            {[
              { emoji: '👨‍🎓', value: '320+', label: 'Students Managed' },
              { emoji: '🧪', value: '45', label: 'Tests This Month' },
              { emoji: '📲', value: '280', label: 'Parent Alerts Sent' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center text-2xl">{stat.emoji}</div>
                <div>
                  <div className="font-bold text-xl">{stat.value}</div>
                  <div className="text-purple-200 text-xs font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300/60">Trusted by institutes across India</p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[480px] my-8">

          {/* ── SUCCESS STATE ── */}
          {success ? (
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Created!</h2>
              <p className="text-slate-500 text-sm">Redirecting you to your dashboard…</p>
            </div>
          ) : step === 'invite' ? (
            /* ── STEP 1: Enter Invite Code ── */
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#5b21b6]/10 flex items-center justify-center mx-auto mb-4">
                  <Key className="w-7 h-7 text-[#5b21b6]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Enter Your Invite Code</h2>
                <p className="text-slate-500 text-sm mt-2">
                  Your administrator provided you a unique code when you subscribed. Enter it below to get started.
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="inviteCode" className="text-sm font-semibold text-slate-700">Invite Code</label>
                  <input
                    id="inviteCode"
                    type="text"
                    required
                    placeholder="e.g. APEX3K9Z"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteError('') }}
                    className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-center text-xl font-mono font-bold tracking-[0.3em] placeholder:text-slate-300 placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all shadow-sm"
                  />
                  {inviteError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1.5">
                      <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold flex-shrink-0">!</span>
                      {inviteError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading || !inviteCode.trim()}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6d28d9] to-[#5b21b6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {inviteLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify & Continue →'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#5b21b6] hover:underline font-medium">Login</Link>
                </p>
              </div>
            </div>
          ) : (
            /* ── STEP 2: Fill Registration Details ── */
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 sm:p-10">
              {/* Step header */}
              <div className="mb-7">
                <button onClick={() => setStep('invite')} className="text-xs text-slate-400 hover:text-[#5b21b6] flex items-center gap-1.5 mb-5 transition-colors">
                  ← Change invite code
                </button>

                {/* Code pill */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    Code verified: {inviteCode}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-800">Complete Your Registration</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {prefilledName
                    ? `Setting up your account for ${prefilledName}. Confirm or update your details below.`
                    : 'Fill in your institute and personal details to create your account.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Coaching Institute Name */}
                <div className="space-y-1.5">
                  <label htmlFor="coachingName" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Coaching Institute Name
                  </label>
                  <input
                    id="coachingName" name="coachingName" type="text" required
                    placeholder="e.g. Apex Academy"
                    value={formData.coachingName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                  />
                </div>

                {/* Owner Name */}
                <div className="space-y-1.5">
                  <label htmlFor="ownerName" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Your Full Name
                  </label>
                  <input
                    id="ownerName" name="ownerName" type="text" required
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                  />
                </div>

                {/* Email + Phone — two columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      Email
                    </label>
                    <input
                      id="email" name="email" type="email" required
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Phone
                    </label>
                    <input
                      id="phone" name="phone" type="tel" required
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      id="password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      required minLength={8}
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
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
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6d28d9] to-[#5b21b6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-1"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating your account…</>
                  ) : (
                    'Create Account & Access Dashboard'
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#5b21b6] hover:underline font-medium">Login</Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
