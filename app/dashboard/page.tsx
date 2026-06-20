import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard',
  description: 'Overview of your coaching center performance.',
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardClient />
    </Suspense>
  )
}
