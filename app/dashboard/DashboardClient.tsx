'use client'

import { useState } from 'react'
import useSWR from 'swr'
import StatCard from '@/components/dashboard/StatCard'
import { Users, ClipboardList, MessageCircle, CalendarCheck, ArrowRight, Loader2, Building2, User, Bell } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface DashboardData {
  displayName: string
  centerName: string
  studentCount: number
  testCount: number
  attendanceRate: string
  activeBatches: number
}

export default function DashboardClient() {
  const [selectedClass, setSelectedClass] = useState('11')
  const [showNotifications, setShowNotifications] = useState(false)

  const { data, isLoading } = useSWR<DashboardData>(
    `/api/std-data/dashboard?class=${selectedClass}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const { data: notifData } = useSWR<{ notifications: any[] }>(
    `/api/std-data/notifications`,
    fetcher
  )

  const notifications = notifData?.notifications ?? []
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  const displayName = data?.displayName ?? 'Rishiraj'
  const centerName = data?.centerName ?? 'TEST ACADEMY'
  const studentCount = data?.studentCount ?? 0
  const testCount = data?.testCount ?? 0
  const attendanceRate = data?.attendanceRate ?? '--'
  const activeBatches = data?.activeBatches ?? 0

  const gettingStartedSteps = [
    {
      step: 1,
      title: 'Add Students',
      description: `Add your students manually with their roll number, batch, and parent contact.`,
      icon: Users,
      href: `/dashboard/students?std=${selectedClass}th`,
      actionLabel: 'Go to Students',
      bgClass: 'bg-indigo-50/80',
      borderClass: 'border-indigo-100 hover:border-indigo-300',
      textClass: 'text-indigo-600',
      iconBg: 'bg-indigo-100/50',
    },
    {
      step: 2,
      title: 'Upload Test Results',
      description: 'Create a test and upload a CSV of marks — ranks and percentages are calculated automatically.',
      icon: ClipboardList,
      href: `/dashboard/tests?std=${selectedClass}th`,
      actionLabel: 'Go to Tests',
      bgClass: 'bg-emerald-50/80',
      borderClass: 'border-emerald-100 hover:border-emerald-300',
      textClass: 'text-emerald-600',
      iconBg: 'bg-emerald-100/50',
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header & Class Toggle */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 mb-8 border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Institute Name:{' '}
              {isLoading && !data ? (
                <span className="inline-block w-32 h-6 bg-slate-100 animate-pulse rounded align-middle" />
              ) : (
                <span className="text-indigo-600">{centerName}</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <p className="font-medium text-[15px]">
              Owner Name:{' '}
              {isLoading && !data ? (
                <span className="inline-block w-24 h-5 bg-slate-100 animate-pulse rounded align-middle" />
              ) : (
                <span className="text-slate-800">{displayName}</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Notifications Toggle */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors border border-slate-200 w-full sm:w-auto flex items-center justify-center"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-100" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      No recent notifications
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notif: any) => (
                        <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-semibold text-slate-800">
                              {notif.title}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(notif.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 leading-snug">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modern Segmented Toggle */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl shadow-inner border border-slate-200/60 w-full sm:w-auto">
            <button
              onClick={() => setSelectedClass('11')}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                selectedClass === '11' 
                  ? 'bg-white text-indigo-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              11th
            </button>
            <button
              onClick={() => setSelectedClass('12')}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                selectedClass === '12' 
                  ? 'bg-white text-indigo-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              12th
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          title="Total Students"
          value={isLoading && !data ? <Loader2 className="w-5 h-5 animate-spin" /> : studentCount}
          icon={Users}
          description={studentCount ? `Students enrolled` : 'Add students to get started'}
          color="purple"
        />
        <StatCard
          title="Tests Uploaded"
          value={isLoading && !data ? <Loader2 className="w-5 h-5 animate-spin" /> : testCount}
          icon={ClipboardList}
          description={testCount ? `Tests created` : 'Create your first test'}
          color="blue"
        />
        <StatCard
          title="Active Batches"
          value={isLoading && !data ? <Loader2 className="w-5 h-5 animate-spin" /> : activeBatches}
          icon={Users}
          description="Running currently"
          color="green"
        />
        <StatCard
          title="Attendance Rate"
          value={isLoading && !data ? <Loader2 className="w-5 h-5 animate-spin" /> : attendanceRate}
          icon={CalendarCheck}
          description={`Average across batches`}
          color="orange"
        />
      </section>

      {/* Welcome card */}
      <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[oklch(0.62_0.22_265/0.08)] rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="text-xl font-bold mb-1">
            Coaching Analytics Portal
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            You are viewing your global dashboard. Use the sidebar to dive into students, fee management, attendance, and tests.
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {gettingStartedSteps.map(({ step, title, description, icon: Icon, href, actionLabel, bgClass, borderClass, textClass, iconBg }) => (
            <div
              key={step}
              className={`rounded-2xl p-6 group relative overflow-hidden transition-all duration-300 border ${bgClass} ${borderClass}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${iconBg}`}>
                  <Icon className={`w-6 h-6 ${textClass}`} />
                </div>
                <span className={`text-4xl font-bold opacity-10 select-none ${textClass}`}>
                  {step}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-lg">
                {title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                {description}
              </p>
              <Link
                href={href}
                className={`inline-flex items-center gap-1.5 text-sm font-bold hover:underline group-hover:gap-2.5 transition-all ${textClass}`}
              >
                {actionLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
