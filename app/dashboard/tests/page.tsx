import { Suspense } from 'react'
import TestsClient from './TestsClient'

export const metadata = {
  title: 'Tests',
  description: 'Manage and upload test results for your coaching center.',
}

export default function TestsPage() {
  return (
    <Suspense>
      <TestsClient />
    </Suspense>
  )
}
