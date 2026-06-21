'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Play, Link as LinkIcon, ClipboardList, Trophy, Trash2, Search, Loader2, AlertCircle, Plus, FileQuestion, Cloud, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 20

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

export default function ResourcesClient({ coachingCenterId, batches, standard }: { coachingCenterId: string, batches: string[], standard: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeBatchTab, setActiveBatchTab] = useState('All')
  const [resourcePage, setResourcePage] = useState(1)

  // Form state
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState(RESOURCE_TYPES[0])
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [targetBatch, setTargetBatch] = useState('All')
  const [externalLink, setExternalLink] = useState('')
  const [description, setDescription] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchResources = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('coaching_center_id', coachingCenterId)
      .eq('standard', standard)
      .order('created_at', { ascending: false })
    if (data) setResources(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachingCenterId, standard])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !externalLink) { setError('Title and Link are required.'); return }
    setIsSubmitting(true)
    setError(null)
    const newResource = {
      coaching_center_id: coachingCenterId, title, resource_type: resourceType, subject,
      target_batches: targetBatch === 'All' ? ['All Batches'] : [targetBatch],
      external_link: externalLink, description, is_important: isImportant, is_featured: isFeatured,
      standard
    }
    const { error: insertError } = await supabase.from('resources').insert([newResource])
    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Resource uploaded successfully!')
      setTitle(''); setExternalLink(''); setDescription(''); setIsImportant(false); setIsFeatured(false)
      fetchResources()
      setTimeout(() => setSuccess(null), 3000)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (!error) setResources(resources.filter(r => r.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5" />
      case 'YouTube Video': return <Play className="w-5 h-5" />
      case 'Assignment': return <ClipboardList className="w-5 h-5" />
      case 'PYQ': return <FileQuestion className="w-5 h-5" />
      case 'Mock Test': return <Trophy className="w-5 h-5" />
      case 'Google Drive Link': return <Cloud className="w-5 h-5" />
      default: return <LinkIcon className="w-5 h-5" />
    }
  }

  const batchTabs = ['All', ...batches]

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (activeBatchTab === 'All') return true
    return r.target_batches.includes(activeBatchTab) || r.target_batches.includes('All Batches')
  })

  // Reset to page 1 whenever filter or batch changes
  useEffect(() => { setResourcePage(1) }, [searchTerm, activeBatchTab])

  const totalResPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE))
  const pagedResources = filteredResources.slice((resourcePage - 1) * PAGE_SIZE, resourcePage * PAGE_SIZE)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* UPLOAD FORM */}
      <div className="lg:col-span-1">
        <div className="glass-card rounded-2xl p-6 sticky top-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[var(--primary)]" />
            Add Resource
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Title *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Physics Revision Notes"
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Type *</label>
                <select value={resourceType} onChange={e => setResourceType(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900">
                  {RESOURCE_TYPES.map(t => <option key={t} value={t} className="bg-white">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Subject *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900">
                  {SUBJECTS.map(t => <option key={t} value={t} className="bg-white">{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Target Batch *</label>
              <select value={targetBatch} onChange={e => setTargetBatch(e.target.value)}
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900">
                <option value="All" className="bg-white">All Batches</option>
                {batches.map(b => <option key={b} value={b} className="bg-white">{b}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">External Link *</label>
              <input type="url" required value={externalLink} onChange={e => setExternalLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief description..." rows={2}
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)}
                  className="rounded border-[var(--border)] bg-white/50 text-[var(--primary)] focus:ring-[var(--primary)]" />
                Important
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
                  className="rounded border-[var(--border)] bg-white/50 text-orange-500 focus:ring-orange-500" />
                Featured
              </label>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Resource'}
            </button>
          </form>
        </div>
      </div>

      {/* RESOURCE LIST */}
      <div className="lg:col-span-2 space-y-4">

        {/* Batch Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {batchTabs.map(tab => (
            <button key={tab} onClick={() => setActiveBatchTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeBatchTab === tab
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                  : 'bg-white/50 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-gray-900 hover:border-[var(--primary)]/40'
              }`}>
              {tab === 'All' ? 'All Batches' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input type="text" placeholder="Search resources..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <span className="text-sm text-[var(--muted-foreground)] shrink-0">{filteredResources.length} items</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[var(--muted-foreground)] animate-spin" /></div>
        ) : filteredResources.length === 0 ? (
          <div className="glass-card rounded-2xl py-12 text-center text-[var(--muted-foreground)]">
            No resources found{activeBatchTab !== 'All' ? ` for ${activeBatchTab}` : ''}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedResources.map(resource => (
              <div key={resource.id} className="glass-card rounded-xl p-4 flex flex-col gap-3 hover:border-[var(--primary)]/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center text-[var(--primary)] shrink-0">
                      {getIcon(resource.resource_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2" title={resource.title}>{resource.title}</h3>
                      <p className="text-xs text-[var(--muted-foreground)]">{resource.subject} • {resource.resource_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <a href={resource.external_link} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors" title="Open">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleDelete(resource.id)}
                      className="p-1.5 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)] border border-[var(--border)]">
                    {resource.target_batches.join(', ')}
                  </span>
                  {resource.is_featured && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">🔥 Featured</span>
                  )}
                  {resource.is_important && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">Important</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalResPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--muted-foreground)]">
              Showing {((resourcePage - 1) * PAGE_SIZE) + 1}–{Math.min(resourcePage * PAGE_SIZE, filteredResources.length)} of {filteredResources.length} resources
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setResourcePage(p => Math.max(1, p - 1))}
                disabled={resourcePage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              {Array.from({ length: totalResPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalResPages || Math.abs(p - resourcePage) <= 1)
                .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
                  acc.push(p)
                  return acc
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-[var(--muted-foreground)] text-sm">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setResourcePage(item as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        resourcePage === item
                          ? 'bg-[var(--primary)] text-white shadow-md'
                          : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)]'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )
              }

              <button
                onClick={() => setResourcePage(p => Math.min(totalResPages, p + 1))}
                disabled={resourcePage === totalResPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
