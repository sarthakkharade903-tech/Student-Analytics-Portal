'use client'

import { useState } from 'react'
import { Phone, Building2 } from 'lucide-react'
import AddCoachingModal from '../AddCoachingModal'

interface Lead {
  id: string
  institute_name: string
  owner_name: string
  email: string
  mobile_number: string
  location: string
  status: string
}

export default function LeadActions({ lead }: { lead: Lead }) {
  const isConverted = lead.status === 'Converted'

  const triggerButton = (
    <button
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all border ${
        isConverted
          ? 'bg-emerald-500/5 text-emerald-400/50 border-emerald-500/10 cursor-not-allowed'
          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/20'
      }`}
      disabled={isConverted}
    >
      <Building2 className="w-3.5 h-3.5" />
      {isConverted ? 'Converted' : 'Create Institute'}
    </button>
  )

  return (
    <div className="flex items-center justify-end gap-2">
      <a
        href={`tel:${lead.mobile_number}`}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
      >
        <Phone className="w-3.5 h-3.5" />
        Call
      </a>

      {!isConverted ? (
        <AddCoachingModal
          leadData={{
            id: lead.id,
            institute_name: lead.institute_name,
            owner_name: lead.owner_name,
            email_id: lead.email,
            mobile_number: lead.mobile_number,
            location: lead.location,
          }}
          triggerButton={triggerButton}
        />
      ) : (
        triggerButton
      )}
    </div>
  )
}
