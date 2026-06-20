import FeeTabs from './FeeTabs'

export const metadata = {
  title: 'Fee Management',
  description: 'Manage fees, installments, batches, and student payments.',
}

export default function FeeManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
          Manage fees, installments, batches, and student payments.
        </p>
      </div>

      <FeeTabs />

      {/* Main Content Area */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  )
}
