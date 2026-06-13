'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BarChart3, Bell, LogOut, Loader2, AlertCircle, ArrowLeft, BookOpen, AlertTriangle, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ParentNav({ studentId }: { studentId: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!studentId) return

    const fetchNotifications = async () => {
      const supabase = createClient()
      const newNotifications = []

      // Fetch student info
      const { data: student } = await supabase
        .from('students')
        .select('batch, coaching_center_id')
        .eq('id', studentId)
        .single()
      
      if (!student) return

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysStr = sevenDaysAgo.toISOString()

      // 1. Absences
      const { data: absences } = await supabase
        .from('scores')
        .select('id, is_absent, created_at, tests(test_name, test_type)')
        .eq('student_id', studentId)
        .eq('is_absent', true)
        .gte('created_at', sevenDaysStr)
        .order('created_at', { ascending: false })

      if (absences) {
        absences.forEach(abs => {
          newNotifications.push({
            id: `abs_${abs.id}`,
            type: 'absence',
            title: `Absent in ${abs.tests?.test_type || 'Test'}`,
            desc: abs.tests?.test_name || 'Unknown test',
            date: abs.created_at,
            icon: <AlertCircle className="w-4 h-4 text-red-400" />,
            bgColor: 'bg-red-500/10'
          })
        })
      }

      // 2. New Resources
      const { data: recentRes } = await supabase
        .from('resources')
        .select('id, title, resource_type, created_at')
        .eq('coaching_center_id', student.coaching_center_id)
        .gte('created_at', sevenDaysStr)
        .or(`target_batches.cs.{"${student.batch}"},target_batches.cs.{"All Batches"}`)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentRes) {
        recentRes.forEach(res => {
          newNotifications.push({
            id: `res_${res.id}`,
            type: 'resource',
            title: `New ${res.resource_type} Uploaded`,
            desc: res.title,
            date: res.created_at,
            icon: <BookOpen className="w-4 h-4 text-blue-400" />,
            bgColor: 'bg-blue-500/10'
          })
        })
      }

      // 3. New Results Published
      const { data: recentResults } = await supabase
        .from('scores')
        .select('id, total, created_at, tests(test_name, max_marks)')
        .eq('student_id', studentId)
        .eq('is_absent', false)
        .gte('created_at', sevenDaysStr)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentResults) {
        recentResults.forEach(res => {
          newNotifications.push({
            id: `result_${res.id}`,
            type: 'result',
            title: 'New Result Published',
            desc: `${res.tests?.test_name}: ${res.total}/${res.tests?.max_marks}`,
            date: res.created_at,
            icon: <Trophy className="w-4 h-4 text-green-400" />,
            bgColor: 'bg-green-500/10'
          })
        })
      }

      // 4. Attendance Drop below 80% (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: attData } = await supabase
        .from('attendance')
        .select('is_present')
        .eq('student_id', studentId)
        .gte('date', thirtyDaysAgo.toISOString())

      if (attData && attData.length > 5) {
        const presentCount = attData.filter(d => d.is_present).length
        const totalCount = attData.length
        const pct = (presentCount / totalCount) * 100
        
        if (pct < 80) {
          newNotifications.push({
            id: `att_drop`,
            type: 'attendance',
            title: 'Attendance Alert',
            desc: `Attendance has dropped to ${Math.round(pct)}%`,
            date: new Date().toISOString(),
            icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,
            bgColor: 'bg-orange-500/10'
          })
        }
      }

      // Sort by date descending
      newNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setNotifications(newNotifications)
    }

    fetchNotifications()
  }, [studentId])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/parent/logout', { method: 'POST' })
    } catch {
      // ignore errors, redirect anyway
    }
    window.location.href = '/parent/login'
  }

  return (
    <nav className="bg-[#0f1729]/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Back */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2540] transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <Link href="/parent" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-white transition-colors">
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
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2540] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border-2 border-white" />
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f1729]/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/50">
                    <h3 className="font-semibold text-sm flex items-center justify-between">
                      Notifications
                      {notifications.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-bold">
                          {notifications.length} New
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors flex gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${notif.bgColor}`}>
                            {notif.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">
                              {notif.title}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-snug">
                              {notif.desc}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                              {new Date(notif.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-12 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-[#1a2540] flex items-center justify-center">
                          <Bell className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 mt-2 font-medium">You're all caught up!</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-800 text-center">
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-[10px] font-semibold text-slate-400 hover:text-white uppercase tracking-wider"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="w-px h-5 bg-slate-800" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all text-sm font-medium disabled:opacity-50"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 border-t border-slate-800 flex gap-6 overflow-x-auto no-scrollbar">
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
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
