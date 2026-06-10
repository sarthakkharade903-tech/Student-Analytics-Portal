'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ className = '' }: { className?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-white/80" />
    </button>
  )
}
