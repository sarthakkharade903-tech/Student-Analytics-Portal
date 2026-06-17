'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ActivationToggle({ initialStatus, instituteId }: { initialStatus: boolean, instituteId: string }) {
  const [isActive, setIsActive] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    const newStatus = !isActive

    try {
      const res = await fetch('/api/superadmin/institutes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instituteId, isActive: newStatus })
      })

      if (res.ok) {
        setIsActive(newStatus)
        router.refresh()
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error(error)
      alert('Error updating status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 border border-white/10 ${
        isActive ? 'bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
          isActive ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
