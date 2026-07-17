'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
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
  Menu,
  X,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ForwardRefExoticComponent<React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>>
  active: boolean
  featureKey?: string
  soon?: boolean
}

const baseNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { href: '/dashboard/students', label: 'Students', icon: Users, active: true, featureKey: 'students' },
  { href: '/dashboard/fee-management', label: 'Fee Management', icon: Banknote, active: true, featureKey: 'fee_management' },
  { href: '/dashboard/tests', label: 'Tests', icon: ClipboardList, active: true, featureKey: 'tests' },
  { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, active: true, featureKey: 'attendance' },
  { href: '/dashboard/resources', label: 'Resources', icon: BookOpen, active: true, featureKey: 'resources' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp, active: true, featureKey: 'analytics' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, active: true },
]

function SidebarInner({ features, logoUrl }: { features?: any, logoUrl?: string | null }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const standard = searchParams.get('std') === '12th' ? '12th' : '11th'
  
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname, searchParams])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const withStd = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/settings') return href
    if (href === '/dashboard/fee-management') {
      return `/dashboard/fee-management/${standard === '12th' ? '12' : '11'}/records`
    }
    return `${href}?std=${standard}`
  }

  const defaultFeatures = {
    students: true,
    fee_management: true,
    tests: true,
    attendance: true,
    resources: true,
    analytics: true
  }
  const currentFeatures = features || defaultFeatures

  return (
    <>
      {/* Mobile Open Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className={`lg:hidden fixed top-5 left-5 z-[40] p-2 bg-[var(--sidebar)] text-[var(--foreground)] border border-[var(--border)] rounded-xl shadow-lg transition-all duration-300 ${isMobileOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Open Button */}
      <button 
        onClick={() => setIsDesktopCollapsed(false)}
        className={`hidden lg:flex fixed top-5 left-5 z-[40] p-2 bg-[var(--sidebar)] text-[var(--foreground)] border border-[var(--border)] rounded-xl shadow-lg transition-all duration-300 ${!isDesktopCollapsed ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[45]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50
        h-screen flex flex-col border-[var(--border)] bg-[var(--sidebar)] overflow-hidden flex-shrink-0
        transition-all duration-300 ease-in-out w-64
        ${isMobileOpen ? 'translate-x-0 border-r shadow-2xl' : '-translate-x-full'}
        ${isDesktopCollapsed ? 'lg:-translate-x-full lg:w-0 lg:border-r-0 lg:opacity-0' : 'lg:translate-x-0 lg:w-64 lg:border-r'}
      `}>
        {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--border)] flex items-center justify-center bg-white flex-shrink-0">
              <Image
                src={logoUrl}
                alt="Academy Logo"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
          )}
          <span className="font-semibold text-sm leading-tight">
            Coaching Analytics<br />
            <span className="text-[9px] font-bold tracking-widest text-[var(--primary)] uppercase bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-sm">Portal</span>
          </span>
        </div>
        
        <button 
           onClick={() => {
             setIsMobileOpen(false)
             setIsDesktopCollapsed(true)
           }}
           className="p-1.5 rounded-md hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-colors"
        >
          <X className="w-4 h-4 lg:hidden" />
          <Menu className="w-4 h-4 hidden lg:block" />
        </button>
      </div>


      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {baseNavItems.map((item) => {
          // Check feature flag
          if (item.featureKey && currentFeatures[item.featureKey] === false) {
            return null // Hide it entirely!
          }

          const Icon = item.icon
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)

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

      {/* Exam Engine + Logout */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        {/* Exam Engine SSO Link (Disabled - Coming Soon) */}
        <div
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--muted-foreground)] opacity-60 cursor-not-allowed transition-all duration-150 text-sm font-medium"
          title="Exam Engine is launching soon!"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
          </svg>
          Exam Engine
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            Soon
          </span>
        </div>

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
    </>
  )
}

export default function Sidebar({ features, logoUrl }: { features?: any, logoUrl?: string | null }) {
  return (
    <Suspense fallback={
      <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border)] bg-[var(--sidebar)]" />
    }>
      <SidebarInner features={features} logoUrl={logoUrl} />
    </Suspense>
  )
}
