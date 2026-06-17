import Link from 'next/link'
import { Shield, LayoutDashboard, Key, LogOut } from 'lucide-react'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white selection:bg-red-500/30">
      {/* Sidebar - Premium Dark Glassmorphism */}
      <aside className="w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-32 bg-red-500/10 blur-[50px] -z-10" />

        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center mr-3 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            SuperAdmin
          </span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 mt-4">
          <Link href="/super-admin-panel-8472/dashboard" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-white shadow-lg transition-all hover:bg-white/10 group">
            <LayoutDashboard className="w-5 h-5 mr-3 text-red-400 group-hover:scale-110 transition-transform" />
            Control Center
          </Link>
          {/* Removed Access Codes standalone link as it will be integrated into the dashboard */}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="px-4 py-3 text-xs font-medium text-white/40 flex items-center justify-center rounded-xl bg-white/5">
            SECURE SESSION
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Background ambient glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/40 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none md:border-none z-10">
          <div className="flex items-center md:hidden">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center mr-3">
               <Shield className="w-4 h-4 text-white" />
             </div>
             <span className="font-bold text-lg tracking-tight">SuperAdmin</span>
          </div>
          <div className="flex items-center ml-auto hidden md:flex">
             <div className="text-xs font-bold tracking-widest text-red-500/80 mr-4 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
               RESTRICTED ZONE
             </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-12 z-10">
          <div className="max-w-7xl mx-auto mt-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
