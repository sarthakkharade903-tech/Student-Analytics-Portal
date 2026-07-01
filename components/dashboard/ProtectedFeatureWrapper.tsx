'use client'

import { ProtectedFeature } from '@/components/dashboard/ProtectedFeature'

interface ProtectedFeatureWrapperProps {
  children: React.ReactNode
  lockedModules: Record<string, string | false>
}

export default function ProtectedFeatureWrapper({ children, lockedModules }: ProtectedFeatureWrapperProps) {
  return (
    <ProtectedFeature lockedModules={lockedModules}>
      {children}
    </ProtectedFeature>
  )
}
