'use client'

import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function PortalLogoutButton() {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      // Set a 3-second timeout so it never hangs forever
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      await fetch('/api/portal/logout', { method: 'POST', signal: controller.signal })
      clearTimeout(timeout)
    } catch {
      // Ignore errors — we redirect regardless
    } finally {
      window.location.href = '/portal'
    }
  }

  return (
    <button
      id="portal-logout-btn"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-all disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
      Sign Out
    </button>
  )
}
