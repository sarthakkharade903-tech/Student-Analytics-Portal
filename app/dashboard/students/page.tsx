import { Suspense } from 'react'
import StudentsClient from './StudentsClient'

export const metadata = {
  title: 'Students',
  description: 'Manage students, batches, and view profiles.',
}

export default function StudentsPage() {
  return (
    <Suspense>
      <StudentsClient />
    </Suspense>
  )
}
