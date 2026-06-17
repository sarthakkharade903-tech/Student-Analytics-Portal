'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, X, Building, User, Mail, Key, Copy, CheckCheck, Loader2 } from 'lucide-react'

export default function AddCoachingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    email: '',
    plan_type: 'Standard'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
    setFormData({ name: '', owner_name: '', email: '', plan_type: 'Standard' })
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

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleClose}
          />
          
          {/* Slide-over Drawer (Half Screen on Desktop, Full on Mobile) */}
          <div className="fixed inset-y-0 right-0 z-[100] w-full md:w-[50vw] max-w-2xl bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 shrink-0 bg-black/20">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Add New Institute</h2>
                <p className="text-sm text-white/40 mt-1">Provision a new coaching center and generate a secure access key.</p>
              </div>
              <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {generatedKey ? (
                <div className="p-10 flex flex-col min-h-full items-center justify-center text-center gap-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <Key className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-white mb-4 tracking-tight">Saved & Generated!</h3>
                    <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
                      The institute has been successfully added to your dashboard. Share this secure key with the owner.
                    </p>
                  </div>
                  
                  <div className="w-full max-w-md bg-black/60 border border-emerald-500/30 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <p className="text-sm font-bold text-emerald-400/50 uppercase tracking-[0.2em] mb-4">Assigned Key</p>
                    <div className="text-5xl font-black tracking-[0.15em] text-emerald-400 font-mono select-all">
                      {generatedKey}
                    </div>
                  </div>

                  <div className="w-full max-w-md flex flex-col gap-4 mt-4">
                    <button
                      onClick={handleCopy}
                      className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 ${
                        copied
                          ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                          : 'bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      {copied ? <><CheckCheck className="w-5 h-5" /> Copied to Clipboard!</> : <><Copy className="w-5 h-5" /> Copy Secret Key</>}
                    </button>
                    <button onClick={handleClose} className="w-full py-4 text-white/40 hover:text-white font-medium transition-colors border border-transparent hover:border-white/10 rounded-xl">
                      Done & Close Drawer
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-w-xl mx-auto w-full pt-12">
                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 font-medium">
                      <X className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Institute Name *</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input required name="name" type="text" value={formData.name} onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                        placeholder="e.g. Apex Classes" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Owner Name *</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input required name="owner_name" type="text" value={formData.owner_name} onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                        placeholder="e.g. Rajesh Sharma" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input required name="email" type="email" value={formData.email} onChange={handleChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                        placeholder="owner@apex.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">Subscription Plan *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => setFormData({...formData, plan_type: 'Standard'})}
                        className={`py-4 px-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                          formData.plan_type === 'Standard' 
                          ? 'bg-red-500/10 border-red-500/40 text-red-400 font-bold shadow-[0_0_15px_rgba(225,29,72,0.1)]' 
                          : 'bg-black/40 border-white/10 text-white/50 hover:border-white/20'
                        }`}>
                        <span className="text-lg">Standard</span>
                        <span className="text-[10px] uppercase tracking-widest opacity-60">1 Year Access</span>
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, plan_type: 'Trial'})}
                        className={`py-4 px-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                          formData.plan_type === 'Trial' 
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                          : 'bg-black/40 border-white/10 text-white/50 hover:border-white/20'
                        }`}>
                        <span className="text-lg">Trial Mode</span>
                        <span className="text-[10px] uppercase tracking-widest opacity-60">14 Days Free</span>
                      </button>
                    </div>
                  </div>

                  {/* Fixed bottom actions */}
                  <div className="pt-8 mt-4 flex flex-col sm:flex-row gap-4">
                    <button type="button" onClick={handleClose}
                      className="w-full sm:w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors order-2 sm:order-1 border border-white/10">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading}
                      className="w-full sm:w-2/3 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg order-1 sm:order-2 hover:scale-[1.02] active:scale-[0.98]">
                      {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Provisioning...</>
                      ) : (
                        'Save & Generate Key'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
