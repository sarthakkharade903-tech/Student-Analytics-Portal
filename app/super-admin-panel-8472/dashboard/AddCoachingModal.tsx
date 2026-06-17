'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Building, User, Mail, Phone, CreditCard, Calendar, Key, Copy, CheckCheck } from 'lucide-react'

export default function AddCoachingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const today = new Date().toISOString().split('T')[0]
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    city: '',
    plan_type: 'Standard',
    start_date: today,
    end_date: oneYearLater,
    account_status: 'Active',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePlanChange = (plan: string) => {
    const start = new Date()
    const end = new Date()
    if (plan === 'Trial') {
      end.setDate(end.getDate() + 14)
    } else {
      end.setFullYear(end.getFullYear() + 1)
    }
    setFormData({
      ...formData,
      plan_type: plan,
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      account_status: plan === 'Trial' ? 'Trial' : 'Active',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/superadmin/institutes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setGeneratedKey(data.code)
        router.refresh()
      } else {
        setError(data.message || 'Failed to create institute')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleClose = () => {
    setIsOpen(false)
    setGeneratedKey('')
    setError('')
    setFormData({
      name: '', owner_name: '', email: '', phone: '', city: '',
      plan_type: 'Standard', start_date: today, end_date: oneYearLater, account_status: 'Active',
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] flex items-center justify-center group"
      >
        <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
        Add New Coaching
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header — fixed */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.02] rounded-t-2xl flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white">Add Coaching Institute</h2>
                <p className="text-xs text-white/40 mt-0.5">Fill in details to provision access and generate a signup key.</p>
              </div>
              <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="overflow-y-auto flex-1">
              {generatedKey ? (
                /* Success State — show generated key */
                <div className="p-8 flex flex-col items-center text-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Key className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Institute Created!</h3>
                    <p className="text-sm text-white/50 max-w-xs mx-auto">
                      Share this one-time access key with the institute owner. They'll use it to sign up and create their account.
                    </p>
                  </div>
                  <div className="w-full bg-black/50 border border-emerald-500/30 rounded-xl p-5">
                    <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Access Key</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl font-black tracking-[0.3em] text-emerald-400 font-mono select-all">
                        {generatedKey}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {copied ? <><CheckCheck className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Key</>}
                  </button>
                  <p className="text-xs text-white/30 max-w-xs">
                    ⚠️ This key is stored permanently. You can also find it anytime in the dashboard table.
                  </p>
                  <button onClick={handleClose} className="text-white/50 hover:text-white text-sm transition-colors underline underline-offset-2">
                    Close
                  </button>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                  )}

                  {/* Institute Name */}
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Institute Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input required name="name" type="text" value={formData.name} onChange={handleChange}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                        placeholder="e.g. Apex Classes" />
                    </div>
                  </div>

                  {/* Owner Name */}
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Owner Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input required name="owner_name" type="text" value={formData.owner_name} onChange={handleChange}
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                        placeholder="e.g. Rajesh Sharma" />
                    </div>
                  </div>

                  {/* Email + Phone — two columns */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input required name="email" type="email" value={formData.email} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                          placeholder="owner@apex.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input name="phone" type="tel" value={formData.phone} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                          placeholder="+91 98765..." />
                      </div>
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">City</label>
                    <input name="city" type="text" value={formData.city} onChange={handleChange}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
                      placeholder="e.g. Pune" />
                  </div>

                  {/* Plan Type */}
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Plan Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ value: 'Standard', label: 'Standard', sub: '1 Year' }, { value: 'Premium', label: 'Premium', sub: '1 Year' }, { value: 'Trial', label: 'Trial', sub: '14 Days' }].map((plan) => (
                        <button key={plan.value} type="button" onClick={() => handlePlanChange(plan.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${formData.plan_type === plan.value ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-black/30 border-white/10 text-white/50 hover:border-white/20'}`}>
                          <div className="text-xs font-bold">{plan.label}</div>
                          <div className="text-[10px] opacity-60">{plan.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates — two columns */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Start Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input required name="start_date" type="date" value={formData.start_date} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-red-500/50 transition-colors text-sm [color-scheme:dark]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">End Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input required name="end_date" type="date" value={formData.end_date} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-3 text-white focus:outline-none focus:border-red-500/50 transition-colors text-sm [color-scheme:dark]" />
                      </div>
                    </div>
                  </div>

                  {/* Summary box */}
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-xs text-white/40 space-y-1">
                    <div className="flex justify-between"><span>Plan</span><span className="text-white/70 font-medium">{formData.plan_type}</span></div>
                    <div className="flex justify-between"><span>Duration</span><span className="text-white/70 font-medium">{formData.start_date} → {formData.end_date}</span></div>
                    <div className="flex justify-between"><span>Status set to</span><span className="text-emerald-400 font-medium">{formData.account_status}</span></div>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(225,29,72,0.3)]">
                    <Key className="w-4 h-4" />
                    {loading ? 'Creating & Generating Key…' : 'Create Institute & Generate Key'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
