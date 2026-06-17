import { redirect } from 'next/navigation'

export default function SuperAdminRoot() {
  // Middleware handles auth checking. If we reach here, we are likely auth'd,
  // but just to be safe we redirect to dashboard.
  redirect('/super-admin-panel-8472/dashboard')
}
