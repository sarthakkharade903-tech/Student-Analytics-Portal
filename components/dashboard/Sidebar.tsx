'use client'

import React from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>>
  active: boolean
  soon?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { href: '/dashboard/students', label: 'Students', icon: Users, active: true },
  { href: '/dashboard/tests', label: 'Tests', icon: ClipboardList, active: true },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, active: true },
  { href: '/dashboard/resources', label: 'Resources', icon: BookOpen, active: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp, active: true },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, active: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Perform a hard navigation to clear all Next.js client-side route cache
    // and ensure the middleware properly catches the cleared session
    window.location.href = '/login'
  }

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
        </div>
        <span className="font-semibold text-sm leading-tight">
          Parent Analytics<br />
          <span className="text-[var(--muted-foreground)] font-normal text-xs">Portal</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
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
              href={item.href}
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
