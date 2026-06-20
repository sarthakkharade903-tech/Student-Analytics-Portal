'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, User, Phone, MapPin, Users, MessageSquare, CheckCircle2, Loader2, Sparkles, Mail } from 'lucide-react'

export default function RequestDemoModal() {
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        id="request-demo-btn"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_4px_24px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_32px_rgba(139,92,246,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4" />
        Request Demo
      </button>

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease' }}
            onClick={handleClose}
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-[210] flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 0.2s ease' }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
              style={{ animation: 'slideUp 0.3s ease' }}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-8 py-7 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-violet-200" />
                    <span className="text-violet-200 text-xs font-bold uppercase tracking-widest">Free 3-Day Trial</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Request a Demo</h2>
                  <p className="text-violet-200 text-sm mt-1">
                    Fill in your details and we'll get back to you within 24 hours.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-8">
                {submitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Request Submitted!</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Thank you! Our team will review your request and contact you on <strong>{form.mobile_number}</strong> within 24 hours to set up your free 3-day trial.
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-4 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors"
                    >
                      Close
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
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Institute Name *</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="institute_name" type="text" value={form.institute_name} onChange={handleChange}
                            placeholder="e.g. Apex Coaching Classes"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Owner Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="owner_name" type="text" value={form.owner_name} onChange={handleChange}
                            placeholder="Your name"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="mobile_number" type="tel" value={form.mobile_number} onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email ID *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="email_id" type="email" value={form.email_id} onChange={handleChange}
                            placeholder="owner@institute.com"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location *</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="location" type="text" value={form.location} onChange={handleChange}
                            placeholder="City / District"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Approx. Students *</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            required name="student_count" type="number" min="1" value={form.student_count} onChange={handleChange}
                            placeholder="e.g. 150"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                          />
                        </div>
                      </div>

                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks <span className="font-normal normal-case">(optional)</span></label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <textarea
                            name="remarks" value={form.remarks} onChange={handleChange}
                            placeholder="Anything specific you want to discuss..."
                            rows={2}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-violet-200 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Request</>}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                      We'll call you within 24 hours. No payment required.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
          `}</style>
        </>,
        document.body
      )}
    </>
  )
}
