'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface LogoUploaderProps {
  currentLogoUrl?: string | null
  onUploadSuccess?: (newUrl: string) => void
}

export default function LogoUploader({ currentLogoUrl, onUploadSuccess }: LogoUploaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = async (file: File) => {
    setError(null)
    
    // Strict 500KB limit
    if (file.size > 500 * 1024) {
      setError('Image must be less than 500KB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image (PNG, JPG, SVG)')
      return
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Delete old logo if it exists
      if (logoUrl) {
        const oldFileName = logoUrl.split('/').pop()
        if (oldFileName) {
          // Fire and forget deletion, don't throw if it fails
          supabase.storage.from('academy_logos').remove([oldFileName]).catch(console.error)
        }
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('academy_logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('academy_logos')
        .getPublicUrl(filePath)

      const newLogoUrl = data.publicUrl

      // Update Database
      const res = await fetch('/api/coaching/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: newLogoUrl })
      })

      if (!res.ok) throw new Error('Failed to save to database')

      setLogoUrl(newLogoUrl)
      if (onUploadSuccess) onUploadSuccess(newLogoUrl)
    } catch (err: any) {
      console.error('Upload error', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleRemove = async () => {
    setIsUploading(true)
    setError(null)
    try {
      // Delete old logo from storage
      if (logoUrl) {
        const oldFileName = logoUrl.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from('academy_logos').remove([oldFileName])
        }
      }

      const res = await fetch('/api/coaching/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: null })
      })
      if (!res.ok) throw new Error('Failed to remove logo')
      
      setLogoUrl(null)
      if (onUploadSuccess) onUploadSuccess('')
    } catch (err: any) {
      setError(err.message || 'Failed to remove image')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-[#0f1729] rounded-xl border border-slate-800 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Academy Logo</h3>
          <p className="text-xs text-slate-400">Max size: 500KB. Displayed on login and dashboard.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {logoUrl ? (
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border border-slate-700 bg-white shadow-lg flex items-center justify-center flex-shrink-0">
            <Image 
              src={logoUrl} 
              alt="Academy Logo" 
              fill 
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
              Change Logo
            </button>
            <button
              onClick={handleRemove}
              disabled={isUploading}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg transition-colors border border-red-500/20 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
            dragActive 
              ? 'border-[var(--primary)] bg-[var(--primary)]/5' 
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/svg+xml, image/webp"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0])
              }
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Click to upload <span className="font-normal text-slate-400">or drag and drop</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG or SVG (max. 500KB)</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
