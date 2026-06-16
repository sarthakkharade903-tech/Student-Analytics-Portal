import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard – Coaching Analytics Portal',
  description: 'Overview of your coaching center performance.',
}

// The heavy data fetching is done client-side via SWR in DashboardClient.
// This server page is now a thin shell — no DB queries at page-render time.
export default function DashboardPage() {
  return <DashboardClient />
}
