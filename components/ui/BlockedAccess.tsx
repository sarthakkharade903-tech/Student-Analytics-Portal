import { ShieldAlert } from 'lucide-react'

export default function BlockedAccess({ message = "Platform Access Suspended" }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-2xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Access Denied</h1>
        <p className="text-[var(--muted-foreground)] mb-6">
          {message}
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Please contact your administrator for more information.
        </p>
      </div>
    </div>
  )
}
