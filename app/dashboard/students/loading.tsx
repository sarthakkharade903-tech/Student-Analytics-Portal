export default function StudentsLoading() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-pulse">
      {/* Page header skeleton */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--border)]" />
        <div>
          <div className="h-7 w-48 rounded-lg bg-[var(--border)] mb-2" />
          <div className="h-3 w-64 rounded bg-[var(--border)]" />
        </div>
      </div>

      {/* Search/filter bar skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 flex-1 rounded-xl bg-[var(--border)]" />
        <div className="h-10 w-36 rounded-xl bg-[var(--border)]" />
        <div className="h-10 w-32 rounded-xl bg-[var(--border)]" />
      </div>

      {/* Table skeleton */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-[var(--border)]">
          {['Roll No', 'Name', 'Batch', 'Parent Phone', 'Actions'].map((col) => (
            <div key={col} className="h-3 w-16 rounded bg-[var(--border)]" />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-[var(--border)]/50">
            <div className="h-4 w-10 rounded bg-[var(--border)]" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--border)]" />
              <div className="h-4 w-28 rounded bg-[var(--border)]" />
            </div>
            <div className="h-4 w-20 rounded bg-[var(--border)]" />
            <div className="h-4 w-28 rounded bg-[var(--border)]" />
            <div className="h-4 w-16 rounded bg-[var(--border)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
