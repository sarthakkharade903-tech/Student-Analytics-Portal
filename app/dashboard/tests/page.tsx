import { Suspense } from 'react'
import TestsClient from './TestsClient'

export const metadata = {
  title: 'Tests – Coaching Analytics Portal',
  description: 'Manage your tests and upload student marks.',
}

export default function TestsPage() {
  return (
    <Suspense>
      <TestsClient />
    </Suspense>
  )
}
