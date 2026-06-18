'use client'
// Cache busting comment to force Next.js HMR rebuild: 1

import { useState } from 'react'
import { MessageCircle, Copy, Check, Save, RotateCcw, Loader2 } from 'lucide-react'

interface WhatsAppShareButtonProps {
  testName: string
  standard: string
  coachingName: string
  portalUrl: string
  initialTemplate?: string | null
}

const DEFAULT_RAW_TEMPLATE = `================================
*STUDENT PERFORMANCE UPDATE*
विद्यार्थी प्रगती अहवाल
================================

Dear Parent / पालकांनो,

The latest test results have been published.
नवीन चाचणीचे निकाल जाहीर करण्यात आले आहेत.

Test / चाचणी:
*{{TEST_NAME}} ({{STANDARD}})*

View:
- Marks / गुण
- Rank / रँक
- Performance Analysis / कामगिरी विश्लेषण

https://studentiq.vercel.app/parent/login

================================
*LOGIN DETAILS / लॉगिन माहिती*

Parent Phone Number + 4 digit pin
पालकांचा मोबाईल नंबर + ४-अंकी पिन
================================

Thank you.
धन्यवाद.

- *{{ACADEMY_NAME}}*`

export default function WhatsAppShareButton({
  testName,
  standard,
  coachingName,
  portalUrl,
  initialTemplate,
}: WhatsAppShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [template, setTemplate] = useState(initialTemplate || DEFAULT_RAW_TEMPLATE)

  const compileMessage = (tmpl: string) => {
    return tmpl
      .replace(/{{TEST_NAME}}/g, testName)
      .replace(/{{STANDARD}}/g, standard)
      .replace(/{{ACADEMY_NAME}}/g, coachingName)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/coaching/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      })
      if (!res.ok) throw new Error('Failed to save')
      alert('Template saved successfully!')
    } catch (err) {
      console.error(err)
      alert('Error saving template.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to the default bilingual message? You will lose any custom changes.')) {
      setTemplate(DEFAULT_RAW_TEMPLATE)
    }
  }

  const handleCopy = async () => {
    try {
      const finalMessage = compileMessage(template)
      await navigator.clipboard.writeText(finalMessage)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  const handleShare = () => {
    const finalMessage = compileMessage(template)
    const encoded = encodeURIComponent(finalMessage)
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5 text-sm"
                title="Reset to Default"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>
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
          </div>
          
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full min-h-[300px] bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-300 resize-y focus:outline-none focus:border-green-500/50 transition-colors custom-scrollbar"
            spellCheck={false}
          />
        </div>

        <div className="w-full md:w-64 flex flex-col justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-lg text-sm font-bold transition-colors border border-slate-600 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Template
          </button>
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
