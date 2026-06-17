'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RefreshCw } from 'lucide-react'

export default function EditInstituteForm({ institute }: { institute: any }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    id: institute.id,
    name: institute.name || '',
    owner_name: institute.owner_name || '',
    email: institute.email || '',
    phone: institute.phone || '',
    city: institute.city || '',
    plan_type: institute.plan_type || 'Standard',
    account_status: institute.account_status || 'Trial',
    start_date: institute.start_date ? new Date(institute.start_date).toISOString().split('T')[0] : '',
    end_date: institute.end_date ? new Date(institute.end_date).toISOString().split('T')[0] : ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Append time portion to dates for valid TIMESTAMPTZ
      const payload = { ...formData }
      if (payload.start_date) payload.start_date = new Date(payload.start_date).toISOString()
      if (payload.end_date) payload.end_date = new Date(payload.end_date).toISOString()

      const res = await fetch('/api/superadmin/institutes/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setMessage('Institute updated successfully!')
        router.refresh()
      } else {
        setMessage(data.message || 'Failed to update')
      }
    } catch (err) {
      setMessage('An error occurred while updating.')
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Institute Name</label>
          <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Owner Name</label>
          <input type="text" value={formData.owner_name} onChange={e => setFormData({...formData, owner_name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Email Address</label>
          <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Phone Number</label>
          <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">City</label>
          <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Plan Type</label>
          <select value={formData.plan_type} onChange={e => setFormData({...formData, plan_type: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors appearance-none">
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
            <option value="Trial">Trial</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Account Status</label>
          <select value={formData.account_status} onChange={e => setFormData({...formData, account_status: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors appearance-none">
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Suspended">Suspended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Start Date</label>
            <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">End Date</label>
            <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-red-500/50 transition-colors [color-scheme:dark]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <span className={`text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
          {message}
        </span>
        <button type="submit" disabled={loading} className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl flex items-center shadow-[0_0_15px_rgba(225,29,72,0.3)] disabled:opacity-50">
          {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
