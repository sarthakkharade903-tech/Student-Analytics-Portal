'use client'

import { ProtectedFeature } from '@/components/dashboard/ProtectedFeature'

interface ProtectedFeatureWrapperProps {
  children: React.ReactNode
  lockedModules: Record<string, boolean>
}

export default function ProtectedFeatureWrapper({ children, lockedModules }: ProtectedFeatureWrapperProps) {
  return (
    <ProtectedFeature lockedModules={lockedModules}>
      {children}
    </ProtectedFeature>
  )
}
