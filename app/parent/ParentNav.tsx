'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BarChart3, Bell, LogOut, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ParentNav({ studentId }: { studentId: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const [absences, setAbsences] = useState<any[]>([])
  const [unreadResourcesCount, setUnreadResourcesCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!studentId) return

    const fetchAbsences = async () => {
      const supabase = createClient()
      
      const { data } = await supabase
        .from('scores')
        .select(`
          id,
          is_absent,
          tests ( id, test_name, test_date, test_type, target_batches )
        `)
        .eq('student_id', studentId)
        .eq('is_absent', true)
        .order('created_at', { ascending: false })

      if (data) {
        setAbsences(data)
      }
    }

    const fetchUnreadResources = async () => {
      const supabase = createClient()
      const { data: student } = await supabase.from('students').select('batch, coaching_center_id').eq('id', studentId).single()
      if (!student) return

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: recentRes } = await supabase
        .from('resources')
        .select('id')
        .eq('coaching_center_id', student.coaching_center_id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .or(`target_batches.cs.{"${student.batch}"},target_batches.cs.{"All Batches"}`)
        
      if (!recentRes || recentRes.length === 0) return

      const recentIds = recentRes.map((r: { id: string }) => r.id)

      const { data: viewedRes } = await supabase
        .from('resource_views')
        .select('resource_id')
        .eq('student_id', studentId)
        .in('resource_id', recentIds)

      const viewedIds = new Set(viewedRes?.map((v: { resource_id: string }) => v.resource_id) || [])
      const unread = recentIds.filter((id: string) => !viewedIds.has(id))
      setUnreadResourcesCount(unread.length)
    }

    fetchAbsences()
    fetchUnreadResources()
  }, [studentId])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/parent/logout', { method: 'POST' })
      router.replace('/parent/login')
    } catch (e) {
      console.error(e)
      setLoggingOut(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Back Button & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Link href="/parent" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
              Student Portal
            </span>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all"
            >
              <Bell className="w-5 h-5" />
              {absences.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0a0f1c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="font-semibold text-sm flex items-center justify-between">
                    Notifications
                    {absences.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                        {absences.length} New
                      </span>
                    )}
                  </h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {absences.length > 0 ? (
                    absences.map((absence) => (
                      <div key={absence.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/[0.02] transition-colors flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/90">
                            Absent for {absence.tests?.test_type || 'Test'}
                          </p>
                          <p className="text-xs text-white/50 mt-1 line-clamp-1">
                            {absence.tests?.test_name}
                          </p>
                          <p className="text-[10px] text-white/40 mt-1">
                            {absence.tests?.test_date ? new Date(absence.tests.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unknown'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-white/50">
                      You're all caught up!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 p-2 rounded-lg text-white/70 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium disabled:opacity-50"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 border-t border-white/5 flex gap-6 overflow-x-auto no-scrollbar">
        {[
          { label: 'Dashboard', path: '/parent' },
          { label: 'Resources', path: '/parent/resources' }
        ].map((tab) => {
          const isActive = tab.path === '/parent' 
            ? pathname === '/parent'
            : pathname.startsWith(tab.path)

          return (
            <Link
              key={tab.label}
              href={tab.path}
              className={`py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                isActive 
                  ? 'border-[var(--primary)] text-[var(--primary)]' 
                  : 'border-transparent text-white/60 hover:text-white/90'
              }`}
            >
              {tab.label}
              {tab.label === 'Resources' && unreadResourcesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold">
                  {unreadResourcesCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
