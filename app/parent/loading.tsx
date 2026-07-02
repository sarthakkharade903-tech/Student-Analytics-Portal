import { Loader2 } from 'lucide-react'

export default function ParentLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-300">
      <div className="w-12 h-12 relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-slate-800/50" />
        <div className="absolute inset-0 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-400 font-medium tracking-wide animate-pulse text-sm">Loading data...</p>
    </div>
  )
}
