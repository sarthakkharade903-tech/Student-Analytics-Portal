'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Play, Link as LinkIcon, ClipboardList, Trophy, Trash2, Search, Loader2, AlertCircle, Plus } from 'lucide-react'

interface Resource {
  id: string
  title: string
  resource_type: string
  subject: string
  target_batches: string[]
  external_link: string
  description: string
  is_important: boolean
  is_featured: boolean
  created_at: string
}

const RESOURCE_TYPES = ['PDF', 'YouTube Video', 'Google Drive Link', 'Assignment', 'PYQ', 'Mock Test']
const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'General']

export default function ResourcesClient({ coachingCenterId, batches }: { coachingCenterId: string, batches: string[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState(RESOURCE_TYPES[0])
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [targetBatch, setTargetBatch] = useState('All') // 'All' or specific batch
  const [externalLink, setExternalLink] = useState('')
  const [description, setDescription] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchResources = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('coaching_center_id', coachingCenterId)
      .order('created_at', { ascending: false })
    
    if (data) setResources(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
  }, [coachingCenterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !externalLink) {
      setError('Title and Link are required.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const newResource = {
      coaching_center_id: coachingCenterId,
      title,
      resource_type: resourceType,
      subject,
      target_batches: targetBatch === 'All' ? ['All Batches'] : [targetBatch],
      external_link: externalLink,
      description,
      is_important: isImportant,
      is_featured: isFeatured
    }

    const { error: insertError } = await supabase.from('resources').insert([newResource])

    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Resource uploaded successfully!')
      setTitle('')
      setExternalLink('')
      setDescription('')
      setIsImportant(false)
      setIsFeatured(false)
      fetchResources()
      setTimeout(() => setSuccess(null), 3000)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (!error) {
      setResources(resources.filter(r => r.id !== id))
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5" />
      case 'YouTube Video': return <Play className="w-5 h-5" />
      case 'Assignment': return <ClipboardList className="w-5 h-5" />
      case 'PYQ': return <FileText className="w-5 h-5" />
      case 'Mock Test': return <Trophy className="w-5 h-5" />
      default: return <LinkIcon className="w-5 h-5" />
    }
  }

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* UPLOAD FORM */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[var(--primary)]" />
            Add Resource
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Physics Revision Notes"
                className="w-full px-3 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Type *</label>
                <select
                  value={resourceType}
                  onChange={e => setResourceType(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-white"
                >
                  {RESOURCE_TYPES.map(t => <option key={t} value={t} className="bg-[#0a0f1c]">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Subject *</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-white"
                >
                  {SUBJECTS.map(t => <option key={t} value={t} className="bg-[#0a0f1c]">{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Target Batch *</label>
              <select
                value={targetBatch}
                onChange={e => setTargetBatch(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-white"
              >
                <option value="All" className="bg-[#0a0f1c]">Multiple Batches (All)</option>
                {batches.map(b => <option key={b} value={b} className="bg-[#0a0f1c]">{b}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">External Link *</label>
              <input
                type="url"
                required
                value={externalLink}
                onChange={e => setExternalLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="w-full px-3 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={e => setIsImportant(e.target.checked)}
                  className="rounded border-[var(--border)] bg-black/20 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                Important
              </label>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                  className="rounded border-[var(--border)] bg-black/20 text-orange-500 focus:ring-orange-500"
                />
                Featured
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Resource'}
            </button>
          </form>
        </div>
      </div>

      {/* RESOURCE LIST */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/20 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <span className="text-sm text-[var(--muted-foreground)]">{filteredResources.length} items</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-[var(--muted-foreground)] animate-spin" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="glass-card rounded-2xl py-12 text-center text-[var(--muted-foreground)]">
            No resources found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map(resource => (
              <div key={resource.id} className="glass-card rounded-xl p-4 flex flex-col hover:border-[var(--primary)]/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center text-[var(--primary)]">
                      {getIcon(resource.resource_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1" title={resource.title}>
                        {resource.title}
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {resource.subject} • {resource.resource_type}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(resource.id)}
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-auto flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
                    {resource.target_batches.join(', ')}
                  </span>
                  {resource.is_featured && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">
                      Featured
                    </span>
                  )}
                  {resource.is_important && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                      Important
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
