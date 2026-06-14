'use client'

import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 border-2 border-[var(--primary)]/20 flex items-center justify-center mb-6">
        <Bell className="w-9 h-9 text-[var(--primary)] opacity-60" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Coming Soon</h2>
      <p className="text-[var(--muted-foreground)] text-sm max-w-xs">
        Fee notifications and reminders for parents and admins will be available in a future update.
      </p>
    </div>
  )
}
