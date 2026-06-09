'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prevents duplicate router.replace() calls on double-submit or StrictMode double-invoke.
  const redirectingRef = useRef(false)

  // ─── No useEffect / authInitializing / getSession() here ──────────────────
  // The middleware (middleware.ts) is the single source of truth for
  // redirecting authenticated users away from this page. Adding a
  // client-side getSession() check created a second redirect path that
  // (a) conflicted with the middleware and (b) showed a spinner on every
  // HMR rebuild, producing the spinner↔form flicker.
  // ──────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (redirectingRef.current) return

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : authError.message
      )
      setLoading(false)
      return
    }

    // Use replace() so the login page is removed from browser history.
    // Do NOT call router.refresh() — it fires a server request for /login
    // while navigation to /dashboard is still in flight, causing the
    // middleware to issue a competing redirect (the original flickering bug).
    redirectingRef.current = true
    router.replace('/dashboard')
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#5b21b6]">Admin Login</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
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

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#6d28d9] to-[#5b21b6] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link href="#" className="text-sm text-[#5b21b6] hover:underline font-medium">
              Forgot Password?
            </Link>
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#5b21b6] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
