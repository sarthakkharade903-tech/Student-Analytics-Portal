'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, AlertOctagon, Key } from 'lucide-react'

export default function DeleteInstituteModal({ instituteId, instituteName }: { instituteId: string, instituteName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [securityCode, setSecurityCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/superadmin/institutes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: instituteId, security_code: securityCode })
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        setError(data.message || 'Failed to delete institute')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center p-2 rounded-lg text-white/30 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20 ml-2"
        title="Permanently Delete Institute"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111] border border-rose-500/30 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(225,29,72,0.15)] overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-rose-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mr-3 border border-rose-500/30">
                    <AlertOctagon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Cascade Delete</h2>
                    <p className="text-xs text-rose-400 font-medium tracking-wide mt-1 uppercase">Danger Zone</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors mt-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleDelete} className="p-6 space-y-5">
              <p className="text-sm text-white/60 leading-relaxed">
                You are about to permanently destroy <strong className="text-white">{instituteName}</strong>. 
                This action will irrevocably erase all linked students, tests, scores, attendance records, and staff profiles.
              </p>

              {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">{error}</div>}
              
              <div>
                <label className="block text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Super Admin Security Code</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/50" />
                  <input 
                    required 
                    type="password" 
                    value={securityCode} 
                    onChange={e => setSecurityCode(e.target.value)} 
                    className="w-full bg-black/50 border border-rose-500/30 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono tracking-widest" 
                    placeholder="Enter Security Code to Confirm" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !securityCode} 
                  className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? 'Destroying...' : 'Obliterate Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
