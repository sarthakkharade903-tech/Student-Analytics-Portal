export default function DashboardLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-[var(--border)]" />
          <div className="h-3 w-24 rounded bg-[var(--border)]" />
          <div className="h-3 w-1 rounded bg-[var(--border)]" />
          <div className="h-3 w-28 rounded bg-[var(--border)]" />
          <div className="h-3 w-1 rounded bg-[var(--border)]" />
          <div className="h-4 w-16 rounded-full bg-[var(--border)]" />
        </div>
        <div className="h-8 w-72 rounded-lg bg-[var(--border)] mb-2" />
        <div className="h-4 w-56 rounded bg-[var(--border)]" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-24 rounded bg-[var(--border)]" />
              <div className="w-8 h-8 rounded-lg bg-[var(--border)]" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-[var(--border)] mb-2" />
            <div className="h-3 w-32 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>

      {/* Welcome card skeleton */}
      <div className="glass-card rounded-2xl p-8 mb-8">
        <div className="h-6 w-64 rounded-lg bg-[var(--border)] mb-3" />
        <div className="h-4 w-full max-w-lg rounded bg-[var(--border)] mb-2" />
        <div className="h-4 w-3/4 rounded bg-[var(--border)]" />
      </div>

      {/* Getting started skeleton */}
      <div className="h-6 w-36 rounded-lg bg-[var(--border)] mb-4" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--border)]" />
              <div className="w-8 h-8 rounded bg-[var(--border)]" />
            </div>
            <div className="h-5 w-28 rounded bg-[var(--border)] mb-3" />
            <div className="h-3 w-full rounded bg-[var(--border)] mb-1" />
            <div className="h-3 w-4/5 rounded bg-[var(--border)] mb-4" />
            <div className="h-3 w-20 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
