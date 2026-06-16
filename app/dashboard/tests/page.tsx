import TestsClient from './TestsClient'

export const metadata = {
  title: 'Tests – Coaching Analytics Portal',
  description: 'Manage your tests and upload student marks.',
}

// All data fetching is done client-side via SWR in TestsClient.
// This server page is a thin shell — switching 11th/12th is now instant with caching.
export default function TestsPage() {
  return <TestsClient />
}
