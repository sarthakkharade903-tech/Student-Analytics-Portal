export default function FeeManagementLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-7 w-52 rounded-lg bg-[var(--border)] mb-2" />
      <div className="h-3 w-72 rounded bg-[var(--border)] mb-8" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="h-3 w-20 rounded bg-[var(--border)] mb-3" />
            <div className="h-8 w-24 rounded-lg bg-[var(--border)] mb-2" />
            <div className="h-3 w-16 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="h-11 w-full rounded-xl bg-[var(--border)] mb-6" />

      {/* Student fee rows */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--border)]" />
            <div className="flex-1">
              <div className="h-4 w-36 rounded bg-[var(--border)] mb-2" />
              <div className="h-3 w-24 rounded bg-[var(--border)]" />
            </div>
            <div className="text-right">
              <div className="h-4 w-20 rounded bg-[var(--border)] mb-2" />
              <div className="h-3 w-16 rounded bg-[var(--border)]" />
            </div>
            <div className="w-24 h-2 rounded-full bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
