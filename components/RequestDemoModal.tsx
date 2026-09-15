'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, User, Phone, MapPin, Users, MessageSquare, CheckCircle2, Loader2, Sparkles, Mail } from 'lucide-react'

interface RequestDemoModalProps {
  buttonText?: string
  className?: string
  showSparkles?: boolean
}

export default function RequestDemoModal({
  buttonText = 'Request Demo',
  className,
  showSparkles = true,
}: RequestDemoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    institute_name: '',
    owner_name: '',
    email_id: '',
    mobile_number: '',
    location: '',
    student_count: '',
    remarks: '',
  })

  useEffect(() => { setMounted(true) }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSubmitted(true)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      setSubmitted(false)
      setError('')
      setForm({ institute_name: '', owner_name: '', email_id: '', mobile_number: '', location: '', student_count: '', remarks: '' })
    }, 300)
  }

  const defaultButtonClass = "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 active:scale-[0.98]"

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        id="request-demo-btn"
        className={className || defaultButtonClass}
      >
        {showSparkles && <Sparkles className="w-4 h-4" />}
        {buttonText}
      </button>

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease' }}
            onClick={handleClose}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 0.2s ease' }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
              onClick={e => e.stopPropagation()}
              style={{ animation: 'slideUp 0.3s ease' }}
            >
              {/* Header */}
              <div className="relative bg-slate-900 border-b border-slate-800 px-8 py-7 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Free 3-Day Trial &bull; No Credit Card
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Request a Live Demo</h2>
                  <p className="text-slate-300 text-sm mt-1">
                    See how StudentIQ helps your institute track marks, manage fees, and engage parents.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-8">
                {submitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border-2 border-emerald-200">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Request Submitted Successfully!</h3>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-md mx-auto">
                      Thank you! Our coaching advisor will reach out to you on <strong>{form.mobile_number}</strong> within 24 hours to set up your institute trial.
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-4 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                        <X className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Institute Name *</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="institute_name" type="text" value={form.institute_name} onChange={handleChange}
                            placeholder="e.g. Apex Coaching Institute"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Owner / Director Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="owner_name" type="text" value={form.owner_name} onChange={handleChange}
                            placeholder="Your name"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mobile Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="mobile_number" type="tel" value={form.mobile_number} onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="email_id" type="email" value={form.email_id} onChange={handleChange}
                            placeholder="director@institute.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Location / City *</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="location" type="text" value={form.location} onChange={handleChange}
                            placeholder="e.g. Pune, Maharashtra"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Approx. Number of Students *</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="student_count" type="number" min="1" value={form.student_count} onChange={handleChange}
                            placeholder="e.g. 150"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Special Requirements <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            name="remarks" value={form.remarks} onChange={handleChange}
                            placeholder="Tell us about exams you prepare students for (JEE, NEET, CET, etc.)..."
                            rows={2}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 hover:shadow-lg active:scale-[0.99]"
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...</> : <>Submit Demo Request</>}
                    </button>

                    <p className="text-center text-xs text-gray-500">
                      We respect your privacy. No spam. You will receive a direct call within 24 hours.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
          `}</style>
        </>,
        document.body
      )}
    </>
  )
}
