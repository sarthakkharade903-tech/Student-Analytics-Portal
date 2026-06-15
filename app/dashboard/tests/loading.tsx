export default function TestsLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-40 rounded-lg bg-[var(--border)] mb-2" />
          <div className="h-3 w-56 rounded bg-[var(--border)]" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-[var(--border)]" />
      </div>

      {/* Test cards skeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="h-5 w-40 rounded-lg bg-[var(--border)]" />
              <div className="h-5 w-14 rounded-full bg-[var(--border)]" />
            </div>
            <div className="h-3 w-32 rounded bg-[var(--border)] mb-2" />
            <div className="h-3 w-24 rounded bg-[var(--border)] mb-5" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-lg bg-[var(--border)]" />
              <div className="h-8 w-8 rounded-lg bg-[var(--border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
