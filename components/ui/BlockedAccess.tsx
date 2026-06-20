import { ShieldAlert, Clock, Phone, Mail } from 'lucide-react'

export default function BlockedAccess({
  message = 'Platform Access Suspended',
  isTrialExpired = false,
}: {
  message?: string
  isTrialExpired?: boolean
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-2xl p-8 shadow-xl text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border ${
          isTrialExpired
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          {isTrialExpired
            ? <Clock className="w-8 h-8 text-amber-500" />
            : <ShieldAlert className="w-8 h-8 text-red-500" />
          }
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {isTrialExpired ? 'Trial Expired' : 'Access Denied'}
        </h1>

        <p className="text-[var(--muted-foreground)] mb-6">{message}</p>

        {isTrialExpired ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)] mb-4">
              Contact us to upgrade to a full plan:
            </p>
            <a
              href="tel:+919999999999"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all"
            >
              <Phone className="w-4 h-4" />
              Call Us
            </a>
            <a
              href="mailto:support@coachingportal.in"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] font-medium transition-all text-sm"
            >
              <Mail className="w-4 h-4" />
              Email Support
            </a>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            Please contact your administrator for more information.
          </p>
        )}
      </div>
    </div>
  )
}
