import { Suspense } from 'react'
import StudentsClient from './StudentsClient'

export const metadata = {
  title: 'Students – Coaching Analytics Portal',
  description: 'Manage your student roster.',
}

export default function StudentsPage() {
  return (
    <Suspense>
      <StudentsClient />
    </Suspense>
  )
}
