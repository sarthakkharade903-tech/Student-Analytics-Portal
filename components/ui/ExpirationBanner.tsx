'use client'

import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

export default function ExpirationBanner({ daysRemaining }: { daysRemaining: number }) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible || daysRemaining > 10 || daysRemaining < 0) return null

  return (
    <div className="bg-gradient-to-r from-red-600/90 to-rose-600/90 backdrop-blur-md text-white px-6 py-3 flex items-center justify-between sticky top-0 z-[100] shadow-lg border-b border-red-500/50">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 animate-pulse text-white" />
        <p className="text-sm font-bold tracking-wide">
          <span className="opacity-90">Subscription Alert:</span> Your plan expires in <span className="font-black text-white text-base">{daysRemaining}</span> days. Please renew now to avoid service interruption!
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="p-1 hover:bg-black/20 rounded-lg transition-colors text-white/80 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
