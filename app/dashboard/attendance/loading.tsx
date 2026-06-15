export default function AttendanceLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-7 w-44 rounded-lg bg-[var(--border)] mb-2" />
      <div className="h-3 w-64 rounded bg-[var(--border)] mb-8" />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="h-3 w-20 rounded bg-[var(--border)] mb-3" />
            <div className="h-8 w-12 rounded-lg bg-[var(--border)]" />
          </div>
        ))}
      </div>

      {/* Student rows */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="h-4 w-36 rounded bg-[var(--border)]" />
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)]/50">
            <div className="w-8 h-8 rounded-full bg-[var(--border)]" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-[var(--border)] mb-1" />
              <div className="h-3 w-20 rounded bg-[var(--border)]" />
            </div>
            <div className="flex gap-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="w-7 h-7 rounded bg-[var(--border)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
