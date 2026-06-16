import StudentsClient from './StudentsClient'

export const metadata = {
  title: 'Students – Coaching Analytics Portal',
  description: 'Manage your student roster.',
}

// All data fetching is done client-side via SWR in StudentsClient.
// This server page is a thin shell — switching 11th/12th is now instant.
export default function StudentsPage() {
  return <StudentsClient />
}
