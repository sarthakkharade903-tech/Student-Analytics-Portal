'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Loader2, ArrowRight } from 'lucide-react'

export default function ParentLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    standard: '11th',
    roll_no: '',
    parent_phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/parent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login')
      }

      router.replace('/parent')
    } catch (err: any) {
      setError(err.message)
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
            <span className="text-4xl">🎓</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Track Your Progress</h1>
          <p className="text-purple-200 text-base max-w-sm mb-12 leading-relaxed">
            AI-powered insights, instant results, and smart analytics to ace every exam.
          </p>

          <div className="w-full max-w-sm space-y-4">
            {/* Stat Card 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <div className="font-bold text-xl">78.4%</div>
                <div className="text-purple-200 text-xs font-medium">Average Score</div>
              </div>
            </div>
            {/* Stat Card 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center text-2xl">
                📝
              </div>
              <div>
                <div className="font-bold text-xl">142</div>
                <div className="text-purple-200 text-xs font-medium">Tests Completed</div>
              </div>
            </div>
            {/* Stat Card 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 text-left shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 flex items-center justify-center text-2xl">
                🏆
              </div>
              <div>
                <div className="font-bold text-xl">#3</div>
                <div className="text-purple-200 text-xs font-medium">Top Rank Achieved</div>
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
            <h2 className="text-2xl font-bold text-[#5b21b6]">Parent / Student Login</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="standard" className="text-sm font-semibold text-slate-700">
                Class Standard
              </label>
              <select
                id="standard"
                value={formData.standard}
                onChange={(e) => setFormData(prev => ({ ...prev, standard: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
              >
                <option value="11th">11th Standard</option>
                <option value="12th">12th Standard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="roll_no" className="text-sm font-semibold text-slate-700">
                Student Roll Number
              </label>
              <input
                id="roll_no"
                type="text"
                required
                value={formData.roll_no}
                onChange={(e) => setFormData(prev => ({ ...prev, roll_no: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                placeholder="e.g. N024"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="parent_phone" className="text-sm font-semibold text-slate-700">
                Registered Phone Number
              </label>
              <input
                id="parent_phone"
                type="tel"
                required
                value={formData.parent_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, parent_phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b21b6]/20 focus:border-[#5b21b6] transition-all text-sm shadow-sm"
                placeholder="10-digit mobile number"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#6d28d9] to-[#5b21b6] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group text-sm mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex justify-center">
            <p className="text-sm text-slate-500">
              Are you an institute admin?{' '}
              <Link href="/login" className="text-[#5b21b6] hover:underline font-medium">
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
