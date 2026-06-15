'use client'
// Cache busting comment to force Next.js HMR rebuild: 1

import { useState } from 'react'
import { MessageCircle, Copy, Check } from 'lucide-react'

interface WhatsAppShareButtonProps {
  testName: string
  standard: string
  coachingName: string
  portalUrl: string
}

export default function WhatsAppShareButton({
  testName,
  standard,
  coachingName,
  portalUrl,
}: WhatsAppShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  
  const defaultMessage = `*Test Results Published!*

Test: *${testName}* (${standard})

View marks, rank & performance analysis:
https://studentiq.vercel.app/parent/login

----------------------------
*Login using:*
Roll Number + Parent Phone
----------------------------

- ${coachingName}`

  const [message, setMessage] = useState(defaultMessage)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  const handleShare = () => {
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  return (
    <div className="bg-[#0f1729] rounded-xl border border-slate-800 p-6 shadow-lg w-full mt-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-400" />
              </div>
              <h3 className="font-semibold text-white">Share Results to Parents</h3>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 text-sm"
              title="Copy message"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-28 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 resize-none focus:outline-none focus:border-green-500/50 transition-colors custom-scrollbar"
            spellCheck={false}
          />
        </div>

        <div className="w-full md:w-64 flex flex-col justify-end">
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle className="w-5 h-5" />
            Send via WhatsApp
          </button>
          <p className="text-xs text-slate-500 text-center mt-3">
            Opens WhatsApp Web or App
          </p>
        </div>
      </div>
    </div>
  )
}
