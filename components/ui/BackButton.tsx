'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ className = '' }: { className?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors shadow-sm ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-current" />
    </button>
  )
}
