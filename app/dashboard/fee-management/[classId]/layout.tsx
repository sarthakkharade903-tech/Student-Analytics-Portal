'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSpreadsheet, UploadCloud, Bell, Wallet, FileText } from 'lucide-react'

import { use } from 'react'

export default function ClassFeeManagementLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ classId: string }>
}) {
  const pathname = usePathname()
  const { classId } = use(params)

  const navItems = [
    { href: `/dashboard/fee-management/${classId}/records`, label: 'Student Records', icon: FileText },
    { href: `/dashboard/fee-management/${classId}/quick-entry`, label: 'Quick Entry', icon: Wallet },
    { href: `/dashboard/fee-management/${classId}/csv-upload`, label: 'CSV Upload', icon: UploadCloud },
    { href: `/dashboard/fee-management/${classId}/notifications`, label: 'Notifications', icon: Bell, soon: true },
  ]

  return (
    <div className="space-y-6">
      {/* Secondary Navigation */}
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--primary)] text-primary-foreground'
                  : 'bg-[var(--sidebar-accent)] text-[var(--foreground)] hover:bg-[oklch(0.62_0.22_265/0.15)] hover:text-[var(--primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
              {item.soon && (
                <span className="ml-1 text-[10px] uppercase tracking-wider font-bold bg-black/20 px-1.5 py-0.5 rounded text-white/90">
                  Soon
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-[var(--sidebar)] border border-[var(--border)] rounded-xl shadow-sm p-6">
        {children}
      </div>
    </div>
  )
}
