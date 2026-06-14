'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  Users,
  ClipboardList,
  CalendarCheck,
  Settings,
  LogOut,
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Banknote,
} from 'lucide-react'
import StandardSwitcher from './StandardSwitcher'

type NavItem = {
  href: string
  label: string
  icon: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>>
  active: boolean
  soon?: boolean
}

const baseNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { href: '/dashboard/students', label: 'Students', icon: Users, active: true },
  { href: '/dashboard/fee-management', label: 'Fee Management', icon: Banknote, active: true },
  { href: '/dashboard/tests', label: 'Tests', icon: ClipboardList, active: true },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, active: true },
  { href: '/dashboard/resources', label: 'Resources', icon: BookOpen, active: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp, active: true },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, active: true },
]

function SidebarInner() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const std = searchParams.get('std') ?? '11th'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Build href with std param preserved
  const withStd = (href: string) => `${href}?std=${std}`

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
        </div>
        <span className="font-semibold text-sm leading-tight">
          Coaching Analytics<br />
          <span className="text-[9px] font-bold tracking-widest text-[var(--primary)] uppercase bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-sm">Portal</span>
        </span>
      </div>

      {/* Standard Switcher */}
      <div className="px-0 pt-3 pb-1 border-b border-[var(--border)]">
        <StandardSwitcher />
        <p className="text-[10px] text-center text-[var(--muted-foreground)] pb-2 font-medium">
          Viewing: <span className="text-[var(--primary)] font-bold">{std} Std</span>
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {baseNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (!item.active) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--muted-foreground)] opacity-50 cursor-not-allowed select-none"
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1">{item.label}</span>
                {item.soon && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--muted-foreground)]">
                    Soon
                  </span>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.label}
              href={withStd(item.href)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-[oklch(0.62_0.22_265/0.15)] text-[var(--primary)]'
                  : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[var(--border)]">
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 text-sm font-medium"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default function Sidebar() {
  return (
    <Suspense fallback={
      <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border)] bg-[var(--sidebar)]" />
    }>
      <SidebarInner />
    </Suspense>
  )
}
