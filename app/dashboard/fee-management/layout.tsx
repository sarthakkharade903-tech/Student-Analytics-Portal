'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FeeManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Helper to check if a path is active
  const isClass11 = pathname.includes('/11')
  const isClass12 = pathname.includes('/12')

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Manage fees, installments, batches, and student payments.
        </p>
      </div>

      {/* Class Switcher Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-4">
        <Link
          href="/dashboard/fee-management/11/records"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isClass11 ? 'bg-[var(--primary)] text-primary-foreground' : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)]'
          }`}
        >
          Class 11
        </Link>
        <Link
          href="/dashboard/fee-management/12/records"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isClass12 ? 'bg-[var(--primary)] text-primary-foreground' : 'bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)]'
          }`}
        >
          Class 12
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  )
}
